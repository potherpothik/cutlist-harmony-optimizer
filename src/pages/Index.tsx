
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpreadsheetTable } from '@/components/SpreadsheetTable';
import { ProfileSizeInput } from '@/components/ProfileSizeInput';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { optimizeCutlist } from '@/lib/optimizer';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  profile_length: number;
  profile_qty: number;
}

const Index = () => {
  const [cutWidth, setCutWidth] = useState(5);
  const [unusableLength, setUnusableLength] = useState(80);
  const [profileSizes, setProfileSizes] = useState<number[]>([6400, 5600, 4900]);
  const [profileData, setProfileData] = useState<ProfileData[]>([
    { profile_length: 2500, profile_qty: 4 },
    // { profile_length: 1800, profile_qty: 6 },
    // { profile_length: 1200, profile_qty: 8 },
  ]);
  const [results, setResults] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const handleOptimize = async () => {
    if (profileData.length === 0) {
      toast({
        title: "No Data",
        description: "Please add profile length data to optimize.",
        variant: "destructive"
      });
      return;
    }

    if (profileSizes.length === 0) {
      toast({
        title: "No Profile Sizes",
        description: "Please specify at least one profile size.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const partsData = profileData
        .filter(row => row.profile_length > 0 && row.profile_qty > 0)
        .map(row => [row.profile_length, row.profile_qty] as [number, number]);

      const optimizationResults = optimizeCutlist(
        partsData,
        profileSizes,
        cutWidth,
        unusableLength
      );

      setResults(optimizationResults);
      toast({
        title: "Optimization Complete",
        description: "Your cutlist has been optimized successfully!",
      });
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: "Optimization Failed",
        description: "An error occurred during optimization. Please check your data.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setProfileData([
      { profile_length: 2500, profile_qty: 4 },
      // { profile_length: 1800, profile_qty: 6 },
      // { profile_length: 1200, profile_qty: 8 },
    ]);
    toast({
      title: "Reset Complete",
      description: "All data has been reset to default values.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Linear Cutlist Optimizer
          </h1>
          <p className="text-lg text-slate-600">
            Advanced bin packing algorithm for optimal material utilization
          </p>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Cut Parameters */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-700 flex items-center gap-2">
                ⚙️ Cut Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cutWidth" className="text-sm font-medium text-slate-600">
                  Cut Width (mm)
                </Label>
                <Input
                  id="cutWidth"
                  type="number"
                  value={cutWidth}
                  onChange={(e) => setCutWidth(Number(e.target.value))}
                  className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="unusableLength" className="text-sm font-medium text-slate-600">
                  Unusable Length (mm)
                </Label>
                <Input
                  id="unusableLength"
                  type="number"
                  value={unusableLength}
                  onChange={(e) => setUnusableLength(Number(e.target.value))}
                  className="mt-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Profile Sizes */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-700 flex items-center gap-2">
                📏 Profile Sizes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileSizeInput
                sizes={profileSizes}
                onChange={setProfileSizes}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-700 flex items-center gap-2">
                🚀 Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 transition-all duration-200 transform hover:scale-105"
              >
                {isOptimizing ? "Optimizing..." : "🎯 Optimize Cutlist"}
              </Button>
              <Button 
                onClick={handleReset}
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2.5 transition-all duration-200"
              >
                🔄 Reset Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Spreadsheet Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-700 flex items-center gap-2">
              📊 Profile Length Data
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Enter your profile lengths and quantities. You can paste data from Excel or upload a CSV file.
            </p>
          </CardHeader>
          <CardContent>
            <SpreadsheetTable
              data={profileData}
              onChange={setProfileData}
            />
          </CardContent>
        </Card>

        {/* Results Section */}
        {results && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-700 flex items-center gap-2">
                📈 Optimization Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsDisplay results={results} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
