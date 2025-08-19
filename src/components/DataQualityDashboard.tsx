import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw,
  Zap,
  Eye,
  Settings,
  BarChart3,
  Shield,
  Target,
  Clock,
  Star,
  Activity,
  Award,
  Lightbulb
} from 'lucide-react';
import { dataValidationService } from '../services/dataValidationService';
import Tooltip from './Tooltip';

interface DataIssue {
  type: 'missing_field' | 'invalid_format' | 'duplicate' | 'inconsistent' | 'outdated';
  field: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedRecords: number;
  examples?: string[];
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

interface DataQualityDashboardProps {
  userId?: string;
  realMode?: boolean;
  compact?: boolean;
  onAutoFix?: (issues: DataIssue[]) => void;
}

const DataQualityDashboard: React.FC<DataQualityDashboardProps> = ({
  userId = 'default-user',
  realMode = false,
  compact = false,
  onAutoFix
}) => {
  const [qualityMetrics, setQualityMetrics] = useState<DataQualityMetrics | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (realMode) {
      loadQualityMetrics();
      validateData();
    }
  }, [userId, realMode]);

  const loadQualityMetrics = async () => {
    try {
      const metrics = await dataValidationService.calculateQualityMetrics(userId);
      setQualityMetrics(metrics);
    } catch (error) {
      console.error('Failed to load quality metrics:', error);
    }
  };

  const validateData = async () => {
    setIsValidating(true);
    try {
      const result = await dataValidationService.validateCRMData(userId, 'all');
      setValidationResult(result);
    } catch (error) {
      console.error('Failed to validate data:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAutoFix = async () => {
    if (!validationResult?.issues) return;

    setIsAutoFixing(true);
    try {
      const autoFixableIssues = validationResult.issues.filter((issue: DataIssue) => 
        issue.type === 'invalid_format' || issue.type === 'inconsistent'
      );

      const results = await dataValidationService.autoFixDataIssues(userId, autoFixableIssues);
      
      console.log(`✅ Auto-fixed ${results.fixed} issues, skipped ${results.skipped}`);
      
      // Refresh data after fixes
      await validateData();
      await loadQualityMetrics();

      if (onAutoFix) {
        onAutoFix(autoFixableIssues);
      }

    } catch (error) {
      console.error('Auto-fix failed:', error);
    } finally {
      setIsAutoFixing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400 dark:text-green-600';
    if (score >= 70) return 'text-yellow-400 dark:text-yellow-600';
    return 'text-red-400 dark:text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  if (!realMode) {
    return (
      <div className="bg-slate-700/30 dark:bg-white/5 rounded-xl p-4 border border-slate-600/30 dark:border-white/10">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-2">
          <Database className="h-4 w-4" />
          <span className={compact ? 'text-sm' : 'text-base'}>Data Quality</span>
        </div>
        <p className="text-gray-300 dark:text-gray-400 text-sm">
          Switch to Live Mode to get AI-powered data quality analysis and automatic fixes for your CRM data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-blue-400 dark:text-blue-600" />
          <div>
            <h3 className={`font-bold text-white dark:text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
              Data Quality Dashboard
            </h3>
            <p className="text-gray-300 dark:text-gray-600 text-sm">
              AI-powered CRM data analysis and optimization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={validateData}
            disabled={isValidating}
            className="p-2 rounded-lg bg-blue-500/20 dark:bg-blue-200 border border-blue-400/30 dark:border-blue-400 text-blue-300 dark:text-blue-600 hover:bg-blue-500/30 dark:hover:bg-blue-300 transition-colors disabled:opacity-50"
          >
            {isValidating ? (
              <div className="animate-spin w-4 h-4 border-2 border-blue-400 dark:border-blue-600 border-t-transparent rounded-full"></div>
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Quality Metrics Overview */}
      {qualityMetrics && (
        <div className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 dark:from-white/5 dark:to-white/10 rounded-xl p-6 border border-slate-600/30 dark:border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-semibold text-white dark:text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-400 dark:text-green-600" />
              Overall Data Quality Score
            </h4>
            <div className={`text-3xl font-bold ${getScoreColor(qualityMetrics.overallScore)}`}>
              {Math.round(qualityMetrics.overallScore)}%
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(qualityMetrics.completeness)}`}>
                {Math.round(qualityMetrics.completeness)}%
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500">Completeness</div>
              <Tooltip 
                content="Percentage of required fields that are filled"
                position="top"
                className="mt-1"
              />
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(qualityMetrics.accuracy)}`}>
                {Math.round(qualityMetrics.accuracy)}%
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500">Accuracy</div>
              <Tooltip 
                content="Percentage of data that follows correct formats"
                position="top"
                className="mt-1"
              />
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(qualityMetrics.consistency)}`}>
                {Math.round(qualityMetrics.consistency)}%
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500">Consistency</div>
              <Tooltip 
                content="Uniformity of data formats and standards"
                position="top"
                className="mt-1"
              />
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(qualityMetrics.timeliness)}`}>
                {Math.round(qualityMetrics.timeliness)}%
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500">Timeliness</div>
              <Tooltip 
                content="How recent and up-to-date your data is"
                position="top"
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-600/30 dark:border-white/10 flex justify-between text-sm text-gray-400 dark:text-gray-500">
            <span>{qualityMetrics.totalRecords} total records analyzed</span>
            <span>Last updated: {qualityMetrics.lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Data Issues & Auto-Fix */}
      {validationResult && (
        <div className="bg-slate-700/30 dark:bg-white/5 rounded-xl p-6 border border-slate-600/30 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-white dark:text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-400 dark:text-orange-600" />
              Data Quality Issues
            </h4>
            
            {validationResult.autoFixAvailable && (
              <button
                onClick={handleAutoFix}
                disabled={isAutoFixing}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isAutoFixing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Auto-Fixing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Auto-Fix Issues
                  </>
                )}
              </button>
            )}
          </div>

          {validationResult.issues.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-400 dark:text-green-600 mx-auto mb-4" />
              <h4 className="text-white dark:text-gray-900 font-semibold mb-2">Data Quality Excellent!</h4>
              <p className="text-gray-300 dark:text-gray-600 text-sm">No significant issues found in your CRM data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {validationResult.issues.slice(0, compact ? 3 : 5).map((issue: DataIssue, index: number) => (
                <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium text-white dark:text-gray-900">{issue.description}</h5>
                      <div className="text-sm opacity-90 mt-1">Field: {issue.field}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{issue.affectedRecords}</div>
                      <div className="text-xs opacity-75">records</div>
                    </div>
                  </div>
                  
                  {issue.examples && issue.examples.length > 0 && (
                    <div className="mt-2 text-xs opacity-75">
                      Examples: {issue.examples.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              ))}
              
              {validationResult.issues.length > (compact ? 3 : 5) && (
                <button
                  onClick={() => setShowDetails(true)}
                  className="w-full py-2 text-gray-400 dark:text-gray-600 hover:text-white dark:hover:text-gray-900 text-sm transition-colors"
                >
                  View {validationResult.issues.length - (compact ? 3 : 5)} more issues →
                </button>
              )}
            </div>
          )}

          {/* Suggestions */}
          {validationResult.suggestions && validationResult.suggestions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-600/30 dark:border-white/10">
              <h5 className="font-medium text-white dark:text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400 dark:text-yellow-600" />
                AI Suggestions
              </h5>
              <div className="space-y-2">
                {validationResult.suggestions.slice(0, 3).map((suggestion: any, index: number) => (
                  <div key={index} className="p-3 bg-yellow-500/10 dark:bg-yellow-100 border border-yellow-400/30 dark:border-yellow-400 rounded-lg">
                    <div className="font-medium text-yellow-200 dark:text-yellow-800 text-sm mb-1">
                      {suggestion.description}
                    </div>
                    <div className="text-xs text-yellow-300 dark:text-yellow-700">
                      Impact: {suggestion.estimatedImpact} • Confidence: {suggestion.confidence}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={validateData}
          disabled={isValidating}
          className="flex items-center justify-center gap-2 p-4 bg-blue-500/20 dark:bg-blue-200 border border-blue-400/30 dark:border-blue-400 rounded-xl text-blue-300 dark:text-blue-600 hover:bg-blue-500/30 dark:hover:bg-blue-300 transition-colors disabled:opacity-50"
        >
          {isValidating ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-blue-400 dark:border-blue-600 border-t-transparent rounded-full" />
              Validating...
            </>
          ) : (
            <>
              <Shield className="h-5 w-5" />
              Run Validation
            </>
          )}
        </button>

        <button
          onClick={loadQualityMetrics}
          className="flex items-center justify-center gap-2 p-4 bg-green-500/20 dark:bg-green-200 border border-green-400/30 dark:border-green-400 rounded-xl text-green-300 dark:text-green-600 hover:bg-green-500/30 dark:hover:bg-green-300 transition-colors"
        >
          <BarChart3 className="h-5 w-5" />
          Refresh Metrics
        </button>

        <button
          onClick={() => setShowDetails(true)}
          className="flex items-center justify-center gap-2 p-4 bg-purple-500/20 dark:bg-purple-200 border border-purple-400/30 dark:border-purple-400 rounded-xl text-purple-300 dark:text-purple-600 hover:bg-purple-500/30 dark:hover:bg-purple-300 transition-colors"
        >
          <Eye className="h-5 w-5" />
          View Details
        </button>
      </div>
    </div>
  );
};

export default DataQualityDashboard;