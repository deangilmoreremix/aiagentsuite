import React, { useState } from 'react';
import { goalCategories, allGoals, getGoalsByCategory } from '../data/goalsData';
import { Goal, GoalCategory } from '../types/goals';
import { ArrowRight, CheckCircle, Clock, Zap, Users, Target, Star } from 'lucide-react';

interface GoalSelectorProps {
  onGoalSelect: (goal: Goal) => void;
  selectedGoals: string[];
  showCategories?: boolean;
}

const GoalSelector: React.FC<GoalSelectorProps> = ({ 
  onGoalSelect, 
  selectedGoals, 
  showCategories = true 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('sales');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [complexityFilter, setComplexityFilter] = useState<string>('All');

  const filteredGoals = allGoals.filter(goal => {
    const categoryMatch = goal.category.toLowerCase() === selectedCategory;
    const priorityMatch = priorityFilter === 'All' || goal.priority === priorityFilter;
    const complexityMatch = complexityFilter === 'All' || goal.complexity === complexityFilter;
    return categoryMatch && priorityMatch && complexityMatch;
  });

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      teal: 'from-teal-500 to-teal-600',
      indigo: 'from-indigo-500 to-indigo-600',
      pink: 'from-pink-500 to-pink-600'
    };
    return colors[color as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-400 bg-red-500/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'Low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return <Zap className="h-4 w-4 text-green-400" />;
      case 'Intermediate': return <Target className="h-4 w-4 text-yellow-400" />;
      case 'Advanced': return <Star className="h-4 w-4 text-red-400" />;
      default: return <Zap className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          What do you want to achieve?
        </h2>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          Choose from 50 business goals across 8 categories. Each goal is powered by AI agents 
          that work together to deliver measurable results.
        </p>
      </div>

      {/* Category Navigation */}
      {showCategories && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {goalCategories.map((category) => {
            const IconComponent = category.icon;
            const isActive = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-6 rounded-xl border transition-all duration-300 transform hover:scale-105 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-blue-500/30'
                }`}
              >
                <div className={`p-3 rounded-lg bg-gradient-to-r ${getColorClasses(category.color)} mb-4 mx-auto w-fit`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{category.name}</h3>
                <p className="text-sm text-gray-300 mb-3">{category.description}</p>
                <div className="text-xs text-blue-400 font-medium">
                  {category.totalGoals} goals
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Priority:</span>
          <div className="flex gap-2">
            {['All', 'High', 'Medium', 'Low'].map(priority => (
              <button
                key={priority}
                onClick={() => setPriorityFilter(priority)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                  priorityFilter === priority
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Complexity:</span>
          <div className="flex gap-2">
            {['All', 'Simple', 'Intermediate', 'Advanced'].map(complexity => (
              <button
                key={complexity}
                onClick={() => setComplexityFilter(complexity)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                  complexityFilter === complexity
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {complexity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          
          return (
            <div
              key={goal.id}
              className={`relative p-6 rounded-xl border transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                isSelected
                  ? 'bg-blue-500/10 border-blue-400/30 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-blue-500/30'
              }`}
              onClick={() => onGoalSelect(goal)}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="h-6 w-6 text-blue-400" />
                </div>
              )}

              {/* Goal Header */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                    {getComplexityIcon(goal.complexity)}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{goal.title}</h3>
                <p className="text-sm text-gray-300 mb-3">{goal.description}</p>
              </div>

              {/* Business Impact */}
              <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
                <div className="text-xs font-medium text-green-400 mb-1">Business Impact</div>
                <div className="text-sm text-gray-300">{goal.businessImpact}</div>
              </div>

              {/* Metrics */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Setup Time</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-400">{goal.estimatedSetupTime}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Agents Required</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span className="text-purple-400">{goal.agentsRequired.length}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">ROI</span>
                  <span className="text-green-400 font-medium">{goal.roi}</span>
                </div>
              </div>

              {/* Tools Preview */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-400 mb-2">Tools Used</div>
                <div className="flex flex-wrap gap-1">
                  {goal.toolsNeeded.slice(0, 3).map((tool, index) => (
                    <span key={index} className="text-xs bg-slate-600/30 text-gray-400 px-2 py-1 rounded-full">
                      {tool}
                    </span>
                  ))}
                  {goal.toolsNeeded.length > 3 && (
                    <span className="text-xs bg-slate-600/30 text-gray-400 px-2 py-1 rounded-full">
                      +{goal.toolsNeeded.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                className={`w-full py-2 rounded-lg font-medium transition-all duration-300 ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {isSelected ? 'Selected' : 'Select Goal'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Goals Summary */}
      {selectedGoals.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Selected Goals ({selectedGoals.length})
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedGoals.map(goalId => {
              const goal = allGoals.find(g => g.id === goalId);
              return goal ? (
                <div key={goalId} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-white text-sm">{goal.title}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalSelector;