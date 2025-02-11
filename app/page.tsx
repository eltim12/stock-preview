"use client";

import { useState, useEffect } from "react";
import { Container, Typography, Box, Button, Alert, Grid2 as Grid, Stack } from "@mui/material";
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Chart from '../components/chart'
import axios from 'axios';
import dayjs from 'dayjs'

const MainPage = () => {
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [isFullSelect, setIsFullSelect] = useState(false);
  const [rows, setRows] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isError, setIsError] = useState(false);
  const [isShowChart, setIsShowChart] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://api.marketstack.com/v1/tickers?access_key=${process.env.NEXT_PUBLIC_STOCK_MARKETSTACK_API_KEY}`
        );
        if (response.data) {
          const rowData = response.data.data.map((e, index) => ({
            id: index + 1,
            symbol: e.symbol,
            name: e.name,
            exchange: e.stock_exchange.name,
            country: e.stock_exchange.country_code
          }));
          setRows(rowData);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs once

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'symbol', headerName: 'Symbol', width: 100 },
    { field: 'name', headerName: 'Name', width: 300, editable: true },
    { field: 'exchange', headerName: 'Exchange', width: 400, editable: true },
    { field: 'country', headerName: 'Country', width: 150, editable: true },
  ];

  const handleSelectionModelChange = (rowSelectionModel) => {
    if (rowSelectionModel.length > 3) {
      setIsFullSelect(true);
      return;
    } else {
      setIsFullSelect(false);
      setSelectionModel(rowSelectionModel);
    }
  };

  const onChangeFromDate = (value) => {
    const date = dayjs(value);
    const formattedDate = date.format('YYYY-MM-DD');
    setFromDate(formattedDate)
  }

  const onChangeToDate = (value) => {
    const date = dayjs(value);
    const formattedDate = date.format('YYYY-MM-DD');
    setToDate(formattedDate)
  }

  const onSearch = () => {
    if (rows.length === 0 || !fromDate || !toDate) {
      setIsError(true);
    } else {
      setIsError(false);
      setLoading(true)
      const selectedSymbols = rows
        .filter(item => selectionModel.includes(item.id))
        .map(item => item.symbol)
        .slice(0, 3); // limit to max 3 symbols

      setTimeout(() => {
        Promise.all(
          selectedSymbols.map(symbol =>
            axios
              .get(`http://api.marketstack.com/v2/eod`, {
                params: {
                  access_key: process.env.NEXT_PUBLIC_STOCK_MARKETSTACK_API_KEY,
                  symbols: symbol,
                  date_from: fromDate,
                  date_to: toDate
                }
              })
              .then(response => ({ symbol, data: response.data.data }))
              .catch(err => {
                console.error(`Error fetching data for ${symbol}:`, err);
                return { symbol, data: [] };
              })
          )
        ).then(results => {
          // format array of responses into an object { AAPL: [...], TSLA: [...] }
          const formattedData = results.reduce((acc, { symbol, data }) => {
            acc[symbol] = data;
            return acc;
          }, {});
          // console.log(JSON.stringify(formattedData),'======')
          setChartData(formattedData);
          setIsShowChart(true);
          setLoading(false)
        });
      }, 1000);
    }
  };


  return (
    <Container maxWidth="lg">
      <Typography variant="h5" gutterBottom>
        Stock Dashboard
      </Typography>
      <Box sx={{ height: 420, width: '100%', marginBottom: 3 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[10]}
          checkboxSelection
          loading={rows.length == 0}
          disableMultipleRowSelection={isFullSelect}
          disableRowSelectionOnClick={true}
          onRowSelectionModelChange={handleSelectionModelChange}
        />
      </Box>

      <LocalizationProvider dateAdapter={AdapterDayjs} sx={{ marginTop: 2 }}>
        <Stack spacing={2} direction="row" style={{ marginTop: 10, justifyContent: 'center', display: 'flex' }}>
          <DatePicker label="From" disableFuture={true} sx={{ marginRight: 2 }} onChange={onChangeFromDate} />
          <DatePicker label="To" disableFuture={true} sx={{ marginRight: 2 }} onChange={onChangeToDate} />
          <Button loading={loading} loadingPosition="end" variant="contained" height={100} size="medium" onClick={onSearch}>Submit search</Button>
          {
            isError && <Grid size={3}>
              <Alert severity="error">Please select stock and input date.</Alert>
            </Grid>
          }
        </Stack>
      </LocalizationProvider>
      <Box sx={{ height: 630, width: '100%', marginTop: 3 }}>
        {isShowChart && <Chart data={chartData} />}
      </Box>
    </Container>
  );
};

export default MainPage;
