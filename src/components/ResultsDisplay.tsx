
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OptimizationResults {
  bins: Record<number, {
    count: number;
    average_waste_percentage: number;
    contents: number[][];
  }>;
  overall_waste_percentage: number;
  remaining_parts: number[];
  layouts: Array<{
    stock_size: number;
    count: number;
    segments: Array<{
      start: number;
      width: number;
      type: 'part' | 'cut' | 'waste';
      location?: number;
      length?: number;
    }>;
  }>;
  summary: {
    total_stock_pieces: number;
    total_profile_length: number;
    total_stock_length: number;
    used_length_percentage: number;
    wastage_percentage: number;
    stock_usage: Array<{
      length: number;
      quantity: number;
    }>;
  };
}

interface ResultsDisplayProps {
  results: OptimizationResults;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const { summary, layouts, bins, remaining_parts } = results;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-700">{summary.total_stock_pieces}</div>
            <div className="text-sm text-blue-600">Total Stock Pieces</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-700">{summary.used_length_percentage.toFixed(1)}%</div>
            <div className="text-sm text-green-600">Material Utilization</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-700">{summary.wastage_percentage.toFixed(1)}%</div>
            <div className="text-sm text-orange-600">Wastage</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-700">{summary.total_stock_length.toLocaleString()}</div>
            <div className="text-sm text-purple-600">Total Stock Length (mm)</div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-700">📦 Stock Usage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.stock_usage.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700">{item.length}mm profiles:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {item.quantity} pieces
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cutting Layouts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-700">✂️ Cutting Layouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {layouts.map((layout, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-sm">
                    Stock: {layout.stock_size}mm
                  </Badge>
                  <Badge variant="secondary">
                    Quantity: {layout.count}
                  </Badge>
                </div>
                
                <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden border">
                  <div className="absolute inset-0 flex">
                    {layout.segments.map((segment, segIndex) => {
                      const widthPercent = (segment.width / layout.stock_size) * 100;
                      const leftPercent = (segment.start / layout.stock_size) * 100;
                      
                      let bgColor = 'bg-slate-300';
                      let textColor = 'text-slate-600';
                      
                      if (segment.type === 'part') {
                        bgColor = 'bg-blue-500';
                        textColor = 'text-white';
                      } else if (segment.type === 'cut') {
                        bgColor = 'bg-slate-400';
                        textColor = 'text-white';
                      } else if (segment.type === 'waste') {
                        bgColor = 'bg-red-400';
                        textColor = 'text-white';
                      }
                      
                      return (
                        <div
                          key={segIndex}
                          className={`${bgColor} border-r border-white flex items-center justify-center text-xs font-medium ${textColor}`}
                          style={{
                            width: `${widthPercent}%`,
                            left: `${leftPercent}%`,
                            position: 'absolute',
                            height: '100%'
                          }}
                        >
                          {segment.type === 'part' && segment.length ? (
                            <span>{segment.length}mm</span>
                          ) : segment.type === 'waste' && segment.width > 50 ? (
                            <span>Waste: {segment.width}mm</span>
                          ) : segment.type === 'cut' ? (
                            <span>Cut</span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Parts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-400 rounded"></div>
                <span>Cuts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span>Waste</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remaining Parts */}
      {remaining_parts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-700">⚠️ Remaining Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {remaining_parts.map((part, index) => (
                <Badge key={index} variant="destructive">
                  {part}mm
                </Badge>
              ))}
            </div>
            <p className="text-sm text-slate-600 mt-2">
              These parts could not be optimally fitted and may need manual handling.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
