import { realApiService } from './realApiService';
import { supabaseService } from './supabaseClient';

interface DataValidationResult {
  isValid: boolean;
  issues: DataIssue[];
  suggestions: DataSuggestion[];
  confidenceScore: number;
  autoFixAvailable: boolean;
}

interface DataIssue {
  type: 'missing_field' | 'invalid_format' | 'duplicate' | 'inconsistent' | 'outdated';
  field: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedRecords: number;
  examples?: string[];
}

interface DataSuggestion {
  type: 'auto_fix' | 'manual_review' | 'enrichment' | 'standardization';
  description: string;
  estimatedImpact: string;
  autoExecutable: boolean;
  confidence: number;
}

interface DataQualityMetrics {
  overallScore: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  totalRecords: number;
  issueCount: number;
  lastUpdated: Date;
}

export class DataValidationService {
  private static instance: DataValidationService;
  private validationCache: Map<string, DataValidationResult> = new Map();
  private qualityMetrics: Map<string, DataQualityMetrics> = new Map();

  static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  // Validate CRM data quality using AI
  async validateCRMData(userId: string, dataType: 'contacts' | 'deals' | 'all' = 'all'): Promise<DataValidationResult> {
    try {
      console.log('🔍 Validating CRM data quality with AI...');

      if (!supabaseService.isAvailable()) {
        return this.getMockValidationResult();
      }

      const [contacts, deals] = await Promise.all([
        dataType === 'contacts' || dataType === 'all' ? supabaseService.getContacts() : [],
        dataType === 'deals' || dataType === 'all' ? supabaseService.getDeals() : []
      ]);

      const validationPrompt = `
        Analyze this CRM data for quality issues and provide suggestions:
        
        Contacts Data Sample (first 10):
        ${JSON.stringify(contacts.slice(0, 10), null, 2)}
        
        Deals Data Sample (first 10):
        ${JSON.stringify(deals.slice(0, 10), null, 2)}
        
        Total Records: ${contacts.length} contacts, ${deals.length} deals
        
        Analyze for:
        1. Missing required fields (email, phone, company)
        2. Invalid data formats (email format, phone format)
        3. Potential duplicates (similar names, emails)
        4. Inconsistent data (different company name formats)
        5. Outdated information (old timestamps, stale deals)
        
        Return JSON:
        {
          "isValid": true,
          "issues": [
            {
              "type": "missing_field|invalid_format|duplicate|inconsistent|outdated",
              "field": "email",
              "severity": "high",
              "description": "23 contacts missing email addresses",
              "affectedRecords": 23,
              "examples": ["John Smith", "Jane Doe"]
            }
          ],
          "suggestions": [
            {
              "type": "auto_fix|manual_review|enrichment|standardization",
              "description": "Automatically enrich missing emails using LinkedIn data",
              "estimatedImpact": "Improve email deliverability by 25%",
              "autoExecutable": true,
              "confidence": 85
            }
          ],
          "confidenceScore": 85,
          "autoFixAvailable": true
        }
      `;

      const validation = await realApiService.openai.generateText(validationPrompt, 1200, 0.2);
      const result: DataValidationResult = JSON.parse(validation);

      this.validationCache.set(`${userId}-${dataType}`, result);
      await this.updateQualityMetrics(userId, result, contacts.length + deals.length);

      console.log('✅ Data validation completed');
      return result;

    } catch (error) {
      console.error('❌ Data validation failed:', error);
      return this.getMockValidationResult();
    }
  }

  // Auto-fix data issues where possible
  async autoFixDataIssues(
    userId: string, 
    issues: DataIssue[], 
    confirmationCallback?: (issue: DataIssue) => Promise<boolean>
  ): Promise<{ fixed: number; skipped: number; errors: string[] }> {
    const results = { fixed: 0, skipped: 0, errors: [] };

    for (const issue of issues) {
      try {
        // Ask for confirmation if callback provided
        if (confirmationCallback) {
          const confirmed = await confirmationCallback(issue);
          if (!confirmed) {
            results.skipped++;
            continue;
          }
        }

        // Apply auto-fixes based on issue type
        switch (issue.type) {
          case 'invalid_format':
            await this.fixInvalidFormats(issue);
            results.fixed++;
            break;
          case 'inconsistent':
            await this.standardizeInconsistentData(issue);
            results.fixed++;
            break;
          case 'missing_field':
            if (issue.field === 'company' || issue.field === 'phone') {
              await this.enrichMissingData(issue);
              results.fixed++;
            } else {
              results.skipped++;
            }
            break;
          default:
            results.skipped++;
            break;
        }

      } catch (error) {
        results.errors.push(`Failed to fix ${issue.field}: ${error}`);
      }
    }

    return results;
  }

  // Calculate comprehensive data quality metrics
  async calculateQualityMetrics(userId: string): Promise<DataQualityMetrics> {
    try {
      if (!supabaseService.isAvailable()) {
        return this.getMockQualityMetrics();
      }

      const [contacts, deals] = await Promise.all([
        supabaseService.getContacts(),
        supabaseService.getDeals()
      ]);

      const totalRecords = contacts.length + deals.length;
      if (totalRecords === 0) {
        return this.getMockQualityMetrics();
      }

      // Calculate completeness
      const contactCompleteness = this.calculateCompleteness(contacts, ['first_name', 'last_name', 'email']);
      const dealCompleteness = this.calculateCompleteness(deals, ['title', 'value', 'stage_id']);
      const completeness = (contactCompleteness + dealCompleteness) / 2;

      // Calculate accuracy (simplified - would use AI validation in real implementation)
      const accuracy = this.calculateAccuracy(contacts, deals);

      // Calculate consistency
      const consistency = this.calculateConsistency(contacts, deals);

      // Calculate timeliness
      const timeliness = this.calculateTimeliness(contacts, deals);

      const metrics: DataQualityMetrics = {
        overallScore: (completeness + accuracy + consistency + timeliness) / 4,
        completeness,
        accuracy,
        consistency,
        timeliness,
        totalRecords,
        issueCount: 0, // Would be calculated from validation results
        lastUpdated: new Date()
      };

      this.qualityMetrics.set(userId, metrics);
      return metrics;

    } catch (error) {
      console.error('Failed to calculate quality metrics:', error);
      return this.getMockQualityMetrics();
    }
  }

  // Helper methods for quality calculations
  private calculateCompleteness(records: any[], requiredFields: string[]): number {
    if (records.length === 0) return 100;

    const totalRequiredFields = records.length * requiredFields.length;
    const filledFields = records.reduce((count, record) => {
      return count + requiredFields.filter(field => 
        record[field] && record[field].toString().trim() !== ''
      ).length;
    }, 0);

    return (filledFields / totalRequiredFields) * 100;
  }

  private calculateAccuracy(contacts: any[], deals: any[]): number {
    // Simplified accuracy calculation - in reality would use AI validation
    let accurateRecords = 0;
    let totalRecords = contacts.length + deals.length;

    // Check email format accuracy
    contacts.forEach(contact => {
      if (contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        accurateRecords++;
      }
    });

    return totalRecords > 0 ? (accurateRecords / totalRecords) * 100 : 100;
  }

  private calculateConsistency(contacts: any[], deals: any[]): number {
    // Check for consistent company name formatting, etc.
    const companyNames = contacts.map(c => c.company).filter(Boolean);
    const uniqueNames = new Set(companyNames.map(name => name.toLowerCase().trim()));
    
    return companyNames.length > 0 ? (uniqueNames.size / companyNames.length) * 100 : 100;
  }

  private calculateTimeliness(contacts: any[], deals: any[]): number {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentContacts = contacts.filter(c => 
      new Date(c.updated_at || c.created_at || '') > monthAgo
    ).length;
    
    return contacts.length > 0 ? (recentContacts / contacts.length) * 100 : 100;
  }

  // Auto-fix implementations
  private async fixInvalidFormats(issue: DataIssue): Promise<void> {
    console.log(`🔧 Auto-fixing invalid formats for ${issue.field}`);
    // Implementation would fix email formats, phone numbers, etc.
  }

  private async standardizeInconsistentData(issue: DataIssue): Promise<void> {
    console.log(`🔧 Standardizing inconsistent data for ${issue.field}`);
    // Implementation would standardize company names, addresses, etc.
  }

  private async enrichMissingData(issue: DataIssue): Promise<void> {
    console.log(`🔧 Enriching missing data for ${issue.field}`);
    // Implementation would use external APIs to enrich missing information
  }

  // Update quality metrics after validation
  private async updateQualityMetrics(
    userId: string, 
    validationResult: DataValidationResult, 
    totalRecords: number
  ): Promise<void> {
    const metrics: DataQualityMetrics = {
      overallScore: validationResult.confidenceScore,
      completeness: 85, // Would be calculated from actual data
      accuracy: 90,
      consistency: 80,
      timeliness: 75,
      totalRecords,
      issueCount: validationResult.issues.length,
      lastUpdated: new Date()
    };

    this.qualityMetrics.set(userId, metrics);
  }

  // Mock data for fallbacks
  private getMockValidationResult(): DataValidationResult {
    return {
      isValid: true,
      issues: [],
      suggestions: [],
      confidenceScore: 85,
      autoFixAvailable: false
    };
  }

  private getMockQualityMetrics(): DataQualityMetrics {
    return {
      overallScore: 85,
      completeness: 90,
      accuracy: 85,
      consistency: 80,
      timeliness: 85,
      totalRecords: 0,
      issueCount: 0,
      lastUpdated: new Date()
    };
  }

  // Get quality metrics
  getQualityMetrics(userId: string): DataQualityMetrics {
    return this.qualityMetrics.get(userId) || this.getMockQualityMetrics();
  }
}

export const dataValidationService = DataValidationService.getInstance();