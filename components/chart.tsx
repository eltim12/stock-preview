import * as React from 'react';
import { Button, Stack } from "@mui/material";
import { LineChart } from '@mui/x-charts/LineChart';
import { mangoFusionPalette } from '@mui/x-charts/colorPalettes';

export default function StockChart({ data }) {
  const [priceType, setPriceType] = React.useState('open');
  const symbols = Object.keys(data).slice(0, 3);

  const series = symbols.map((symbol, index) => ({
    id: symbol,
    data: data[symbol].map(entry => entry[priceType]),
    label: `${symbol} (${priceType})`,
    color: mangoFusionPalette('light')[index],
  }));

  const xAxisData = data[symbols[0]]?.map(entry => new Date(entry.date).toLocaleDateString()) || [];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <LineChart
        xAxis={[{ data: xAxisData, scaleType: 'band', label: 'Date' }]}
        series={series}
        height={400}
      />
      <Stack spacing={2} direction="row" style={{ marginTop: 10, justifyContent: 'center', display: 'flex' }}>
        {['open', 'high', 'low', 'close'].map(type => (
          <Button
            key={type}
            variant={priceType === type ? 'contained' : 'outlined'}
            onClick={() => setPriceType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} Price
          </Button>
        ))}
      </Stack>
    </div>
  );
}
