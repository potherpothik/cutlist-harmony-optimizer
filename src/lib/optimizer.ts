
// Linear Cutlist Optimizer - React Implementation
// This preserves the exact Python algorithm logic

interface BinInfo {
  count: number;
  average_waste_percentage: number;
  contents: number[][];
}

interface OptimizationResult {
  bins: Record<number, BinInfo>;
  overall_waste_percentage: number;
  remaining_parts: number[];
}

interface LayoutSegment {
  start: number;
  width: number;
  type: 'part' | 'cut' | 'waste';
  location?: number;
  length?: number;
}

interface Layout {
  stock_size: number;
  count: number;
  segments: LayoutSegment[];
}

const LOW_WASTE_THRESHOLD = 0.05;
const MIN_BIN_QUANTITY = 4;

function binPackingSolution(
  parts: [number, number][],
  binSizes: number[],
  cutWidth: number,
  unusableLength: number,
  minBinQuantity: number = MIN_BIN_QUANTITY
): OptimizationResult {
  // Expand and sort parts list
  const inventory: number[] = [];
  for (const [length, qty] of parts) {
    for (let i = 0; i < qty; i++) {
      inventory.push(length);
    }
  }
  inventory.sort((a, b) => b - a);

  // Prepare bins info
  const binsInfo = binSizes
    .map(s => [s, s - unusableLength] as [number, number])
    .sort((a, b) => b[0] - a[0]);

  function calcWastePercentage(full: number, partList: number[]): number {
    const used = partList.reduce((sum, part) => sum + part, 0) + cutWidth * (partList.length - 1);
    return (full - used) / full;
  }

  function findBestFit(space: number, available: number[], maxParts: number = 2): number[] {
    if (available.length === 0) return [];
    
    if (maxParts === 1) {
      for (const part of available) {
        if (part <= space) return [part];
      }
      return [];
    }

    let bestCombination: number[] = [];
    let bestWaste = space;

    for (let i = 0; i < available.length; i++) {
      const part = available[i];
      if (part > space) continue;

      const waste1 = space - part;
      if (waste1 < bestWaste) {
        bestWaste = waste1;
        bestCombination = [part];
      }

      const remainingSpace = space - part - cutWidth;
      if (remainingSpace > 0) {
        const remainingParts = [...available.slice(0, i), ...available.slice(i + 1)];
        const subCombination = findBestFit(remainingSpace, remainingParts, 1);
        
        if (subCombination.length > 0) {
          const combination = [part, ...subCombination];
          const waste2 = space - combination.reduce((sum, p) => sum + p, 0) - cutWidth * (combination.length - 1);
          
          if (waste2 < bestWaste) {
            bestWaste = waste2;
            bestCombination = combination;
          }
        }
      }
    }

    return bestCombination;
  }

  // First-pass packing
  const remaining = [...inventory];
  const packedBins: [number, number[], number][] = [];

  while (remaining.length > 0) {
    let bestBin: [number, number[], number] | null = null;

    for (const [full, usable] of binsInfo) {
      const tempRemaining = [...remaining];
      const pack = [tempRemaining.shift()!];
      let space = usable - pack[0];

      while (space > cutWidth && tempRemaining.length > 0) {
        const addition = findBestFit(space, tempRemaining);
        if (addition.length === 0) break;

        for (const part of addition) {
          pack.push(part);
          const index = tempRemaining.indexOf(part);
          tempRemaining.splice(index, 1);
        }
        space -= addition.reduce((sum, p) => sum + p, 0) + cutWidth * addition.length;
      }

      const waste = calcWastePercentage(full, pack);
      if (!bestBin || waste < bestBin[2]) {
        bestBin = [full, pack, waste];
        if (waste < LOW_WASTE_THRESHOLD) break;
      }
    }

    if (!bestBin) break;

    packedBins.push(bestBin);
    for (const part of bestBin[1]) {
      const index = remaining.indexOf(part);
      remaining.splice(index, 1);
    }
  }

  // Group by size and enforce minimum run quantity
  const bySize: Record<number, [number[], number][]> = {};
  for (const [size, run, waste] of packedBins) {
    if (!bySize[size]) bySize[size] = [];
    bySize[size].push([run, waste]);
  }

  const finalBins: Record<number, [number[], number][]> = {};
  const leftovers: number[] = [];

  for (const [size, runs] of Object.entries(bySize)) {
    const sizeNum = parseInt(size);
    if (runs.length >= minBinQuantity) {
      finalBins[sizeNum] = runs;
    } else {
      for (const [run] of runs) {
        leftovers.push(...run);
      }
    }
  }

  // Repack leftovers with minBinQuantity = 1
  let finalRemaining = remaining;
  if (leftovers.length > 0) {
    const partCounts: Record<number, number> = {};
    for (const part of leftovers) {
      partCounts[part] = (partCounts[part] || 0) + 1;
    }

    const subParts: [number, number][] = Object.entries(partCounts).map(([length, qty]) => [
      parseInt(length),
      qty
    ]);

    const subResult = binPackingSolution(subParts, binSizes, cutWidth, unusableLength, 1);
    
    // Merge results
    for (const [size, info] of Object.entries(subResult.bins)) {
      const sizeNum = parseInt(size);
      if (!finalBins[sizeNum]) finalBins[sizeNum] = [];
      
      for (const run of info.contents) {
        const avgWaste = info.average_waste_percentage / 100 / info.count;
        finalBins[sizeNum].push([run, avgWaste]);
      }
    }
    
    finalRemaining = subResult.remaining_parts;
  }

  // Calculate summary
  let totalWasteAmount = 0;
  let totalMaterial = 0;

  const binSummary: Record<number, BinInfo> = {};
  for (const [size, runs] of Object.entries(finalBins)) {
    const sizeNum = parseInt(size);
    const count = runs.length;
    const wasteList = runs.map(([, waste]) => waste);
    const avgPercentage = count > 0 ? (wasteList.reduce((sum, w) => sum + w, 0) / count) * 100 : 0;
    
    binSummary[sizeNum] = {
      count,
      average_waste_percentage: avgPercentage,
      contents: runs.map(([run]) => run)
    };

    totalWasteAmount += wasteList.reduce((sum, w) => sum + w, 0) * sizeNum;
    totalMaterial += sizeNum * count;
  }

  const overallPercentage = totalMaterial > 0 ? (totalWasteAmount / totalMaterial) * 100 : 0;

  return {
    bins: binSummary,
    overall_waste_percentage: overallPercentage,
    remaining_parts: finalRemaining
  };
}

function generateLayouts(result: OptimizationResult, cutWidth: number): Layout[] {
  const layouts: Layout[] = [];

  for (const [size, info] of Object.entries(result.bins)) {
    const sizeNum = parseInt(size);
    
    for (const parts of info.contents) {
      const segments: LayoutSegment[] = [];
      let position = 0;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        segments.push({
          start: position,
          width: part,
          type: 'part',
          location: i + 1,
          length: part
        });
        position += part;

        if (i < parts.length - 1) {
          segments.push({
            start: position,
            width: cutWidth,
            type: 'cut'
          });
          position += cutWidth;
        }
      }

      const waste = sizeNum - position;
      if (waste > 0) {
        segments.push({
          start: position,
          width: waste,
          type: 'waste'
        });
      }

      layouts.push({
        stock_size: sizeNum,
        count: info.count,
        segments
      });
    }
  }

  return layouts;
}

export function optimizeCutlist(
  partsData: [number, number][],
  binSizes: number[],
  cutWidth: number,
  unusableLength: number
) {
  console.log('Starting optimization with:', { partsData, binSizes, cutWidth, unusableLength });
  
  const result = binPackingSolution(partsData, binSizes, cutWidth, unusableLength);
  const layouts = generateLayouts(result, cutWidth);

  // Calculate summary
  const totalStockPieces = Object.values(result.bins).reduce((sum, info) => sum + info.count, 0);
  const totalProfileLength = partsData.reduce((sum, [length, qty]) => sum + length * qty, 0);
  const totalStockLength = Object.entries(result.bins).reduce(
    (sum, [size, info]) => sum + parseInt(size) * info.count,
    0
  );
  const usedLengthPercentage = 100 - result.overall_waste_percentage;

  const stockUsage = Object.entries(result.bins).map(([size, info]) => ({
    length: parseInt(size),
    quantity: info.count
  }));

  const summary = {
    total_stock_pieces: totalStockPieces,
    total_profile_length: totalProfileLength,
    total_stock_length: totalStockLength,
    used_length_percentage: usedLengthPercentage,
    wastage_percentage: result.overall_waste_percentage,
    stock_usage: stockUsage
  };

  console.log('Optimization complete:', { result, layouts, summary });

  return {
    ...result,
    layouts,
    summary
  };
}
