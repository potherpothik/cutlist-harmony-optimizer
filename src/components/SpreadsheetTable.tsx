
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Upload } from 'lucide-react';

interface ProfileData {
  profile_length: number;
  profile_qty: number;
}

interface SpreadsheetTableProps {
  data: ProfileData[];
  onChange: (data: ProfileData[]) => void;
}

export const SpreadsheetTable: React.FC<SpreadsheetTableProps> = ({ data, onChange }) => {
  const [selectedCell, setSelectedCell] = useState<{row: number, col: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const updateCell = (rowIndex: number, field: keyof ProfileData, value: number) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    onChange(newData);
  };

  const addRow = () => {
    const newData = [...data, { profile_length: 0, profile_qty: 0 }];
    onChange(newData);
  };

  const deleteRow = (index: number) => {
    if (data.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "At least one row is required.",
        variant: "destructive"
      });
      return;
    }
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
  };

  const handlePaste = (e: React.ClipboardEvent, rowIndex: number, field: keyof ProfileData) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const rows = pastedData.split('\n').filter(row => row.trim());
    
    if (rows.length === 1) {
      // Single cell paste
      const value = parseFloat(rows[0].split('\t')[0]) || 0;
      updateCell(rowIndex, field, value);
    } else {
      // Multi-row paste
      const newData = [...data];
      rows.forEach((row, i) => {
        const targetRowIndex = rowIndex + i;
        const values = row.split('\t');
        
        if (targetRowIndex >= newData.length) {
          // Add new rows if needed
          while (newData.length <= targetRowIndex) {
            newData.push({ profile_length: 0, profile_qty: 0 });
          }
        }
        
        if (field === 'profile_length' && values[0]) {
          newData[targetRowIndex].profile_length = parseFloat(values[0]) || 0;
        }
        if (field === 'profile_qty' && values[0]) {
          newData[targetRowIndex].profile_qty = parseFloat(values[0]) || 0;
        }
        
        // If pasting two columns
        if (values.length >= 2) {
          newData[targetRowIndex].profile_length = parseFloat(values[0]) || 0;
          newData[targetRowIndex].profile_qty = parseFloat(values[1]) || 0;
        }
      });
      
      onChange(newData);
      toast({
        title: "Data Pasted",
        description: `Pasted ${rows.length} rows successfully.`,
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim());
        const newData: ProfileData[] = [];

        // Skip header row if it contains non-numeric data
        const startIndex = isNaN(parseFloat(rows[0]?.split(',')[0])) ? 1 : 0;

        for (let i = startIndex; i < rows.length; i++) {
          const values = rows[i].split(',').map(v => v.trim());
          if (values.length >= 2) {
            const length = parseFloat(values[0]) || 0;
            const qty = parseFloat(values[1]) || 0;
            if (length > 0 && qty > 0) {
              newData.push({ profile_length: length, profile_qty: qty });
            }
          }
        }

        if (newData.length > 0) {
          onChange(newData);
          toast({
            title: "CSV Uploaded",
            description: `Loaded ${newData.length} rows from CSV file.`,
          });
        } else {
          toast({
            title: "Upload Failed",
            description: "No valid data found in the CSV file.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Failed to parse the CSV file.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload CSV
        </Button>
        <Button
          onClick={addRow}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Row
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-700 min-w-[100px]">Row</th>
                <th className="text-left p-3 font-semibold text-slate-700 min-w-[200px]">Profile Length (mm)</th>
                <th className="text-left p-3 font-semibold text-slate-700 min-w-[150px]">Quantity</th>
                <th className="text-left p-3 font-semibold text-slate-700 w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 text-slate-600 font-medium">{index + 1}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={row.profile_length}
                      onChange={(e) => updateCell(index, 'profile_length', parseFloat(e.target.value) || 0)}
                      onPaste={(e) => handlePaste(e, index, 'profile_length')}
                      onFocus={() => setSelectedCell({row: index, col: 'profile_length'})}
                      className={`border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        selectedCell?.row === index && selectedCell?.col === 'profile_length' ? 'bg-blue-50' : ''
                      }`}
                      placeholder="Enter length"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={row.profile_qty}
                      onChange={(e) => updateCell(index, 'profile_qty', parseFloat(e.target.value) || 0)}
                      onPaste={(e) => handlePaste(e, index, 'profile_qty')}
                      onFocus={() => setSelectedCell({row: index, col: 'profile_qty'})}
                      className={`border-0 bg-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        selectedCell?.row === index && selectedCell?.col === 'profile_qty' ? 'bg-blue-50' : ''
                      }`}
                      placeholder="Enter quantity"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      onClick={() => deleteRow(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
        <p className="font-medium mb-1">💡 Tips:</p>
        <ul className="space-y-1 text-xs">
          <li>• You can paste data directly from Excel (Ctrl+V)</li>
          <li>• Upload CSV files with columns: profile_length, profile_qty</li>
          <li>• Click on cells to select and edit values</li>
        </ul>
      </div>
    </div>
  );
};
