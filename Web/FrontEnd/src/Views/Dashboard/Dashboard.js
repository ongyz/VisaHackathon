import React from 'react';
import styled from 'styled-components';
import API from '../../utils/baseUrl';
import { Row, Col, Form, Select } from 'antd';
import { defaultTheme } from '../../utils/theme';
import { PieChartOutlined } from '@ant-design/icons';
import { renderActiveShapeSalesQuantity, renderActiveShapeSalesAmount } from './pieChartUtils';
import { PieChart, Pie, ResponsiveContainer, Cell } from 'recharts';
import GridLayout from 'react-grid-layout';
import Linechart from './Linechart';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import dateRangeLogo from '../../images/DateRangeIcon.svg';
import { Button } from '@material-ui/core';

const { Option } = Select;

// note: the following calculations are to overwrite the auto resize of react-grid-layout
const StyledDiv = styled.div`
  background: white;
  padding: 10px;
  min-width: 32.25%;
  left: ${(props) => (props.index === 0 ? 0.83333 : props.index === 1 ? 33.9167 : 66.9167)}% !important;
`;

const StyledDivBottom = styled.div`
  left: 0.833333% !important;
  min-width: 98.3333%;
  background: white;
`;

const CloseButton = styled.span`
  cursor: pointer;
  position: absolute;
  display: block;
  padding: 2px 5px;
  line-height: 20px;
  right: 3px;
  top: 3px;
  font-size: 38px;
  color: #faa913;
`;

const DatePickGroup = styled.div`
  position: absolute;
  z-index: 1;
  background-color: #1a1f71;
  padding: 20px;
  padding-bottom: 45px;
  right: 15px;
  top: 117px;
  border-radius: 7px;
`;

const StyledBreadCrumbsContainer = styled.div`
  font-size: 35px;
  left: 0.833333%;
  font-weight: bold;
  padding: 15px;
`;

const StyledTitleContainer = styled.div`
  font-size: 25px;
  font-weight: bold;
`;

const StyledContainer = styled(GridLayout)`
  position: relative;
`;

const StyledTotalSalesContainer = styled.div`
  width: 100%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-size: 50px;
  font-weight: bold;
`;

const Icons = styled.img`
  width: 24px;
  height: 24px;
  padding-right: 5px;
`;

const StyledButton = styled(Button)`
  && {
    color: grey;
    border: 1px solid grey;
    right: 15px;
    position: absolute;
  }
`;

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: [],
      isMounted: false,
      activeIndexSalesAmount: 0,
      activeIndexSalesQuantity: 0,
      isChooseDate: false,
      sumSales: 0,
      selectionRange: {
        startDate: new Date(Date.now() - 864e5 * 13),
        endDate: new Date(),
        key: 'selection',
      },
    };
  }

  onSalesAmountPieEnter = (data, index) => {
    this.setState({
      activeIndexSalesAmount: index,
    });
  };

  onSalesQuantityPieEnter = (data, index) => {
    this.setState({
      activeIndexSalesQuantity: index,
    });
  };

  getAllOrders() {
    // get orders of this merchant (used for both pie charts)
    const body = {
      merchantId: this.props.loggedInUserId,
    };
    API.post('api/order/getAll', body)
      .then((res) => {
        if (res.data.success) {
          let orders = res.data.orders;

          let d = new Date(Date.now() - 864e5 * 13);
          let totalPrice = 0;
          let salesQuantityData = [];
          const salesAmountData = [];
          const dailyRevenue = [];
          let sales = {};
          let data = {};

          for (var i = 13; i >= 0; i--) {
            //set keys for data, key = date
            let index = {};
            let d = new Date(Date.now() - 864e5 * i);
            index.time = d;
            index.Revenue = 0;
            let key = d.getDate() + d.getMonth() * 28;
            data[key] = index;
          }

          orders.map((order) => {
            let orderDate = new Date(order.payment.dateTime);
            if (orderDate >= d) {
              let price = order.quantity * order.product.price;
              totalPrice += price;

              let name = order.product.name;
              if (typeof sales[name] === 'undefined') {
                sales[name] = [order.quantity, price];
              } else {
                sales[name][0] += order.quantity;
                sales[name][1] += price;
              }

              let key = orderDate.getDate() + orderDate.getMonth() * 28;
              data[key].Revenue += totalPrice;
            }
          });

          for (const [key, value] of Object.entries(data)) {
            value.time = value.time.toLocaleDateString();
            dailyRevenue.push(value);
          }

          for (const [key, value] of Object.entries(sales)) {
            let a = { name: key, value: value[1] };
            salesAmountData.push(a);
            let q = { name: key, value: value[0] };
            salesQuantityData.push(q);
          }

          this.setState({
            sumSales: totalPrice,
            orders: orders,
            salesQuantityData: salesQuantityData,
            salesAmountData: salesAmountData,
            dailyRevenue: dailyRevenue,
          });
        }
        this.setState({ isMounted: true });
      })
      .catch((err) => console.error(err));
  }

  componentDidMount() {
    this.getAllOrders();
  }

  updateData = (startDate, endDate) => {
    const { orders } = this.state;

    let totalPrice = 0;
    let salesQuantityData = [];
    const salesAmountData = [];
    const dailyRevenue = [];
    let sales = {};
    let data = {};

    const daysDiff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 864e5;
    for (var i = daysDiff - 1; i >= 0; i--) {
      //set keys for data, key = date
      let index = {};
      let d = new Date(new Date(endDate).getTime() - 864e5 * (i + 1));
      index.time = d;
      index.Revenue = 0;
      let key = d.getDate() + d.getMonth() * 28;
      data[key] = index;
    }

    orders.map((order) => {
      let orderDate = new Date(order.payment.dateTime);
      if (orderDate >= startDate && orderDate <= endDate) {
        let price = order.quantity * order.product.price;
        totalPrice += price;

        let name = order.product.name;
        if (typeof sales[name] === 'undefined') {
          sales[name] = [order.quantity, price];
        } else {
          sales[name][0] += order.quantity;
          sales[name][1] += price;
        }

        let key = orderDate.getDate() + orderDate.getMonth() * 28;
        data[key].Revenue += totalPrice;
      }
    });

    for (const [key, value] of Object.entries(data)) {
      value.time = value.time.toLocaleDateString();
      dailyRevenue.push(value);
    }

    for (const [key, value] of Object.entries(sales)) {
      let a = { name: key, value: value[1] };
      salesAmountData.push(a);
      let q = { name: key, value: value[0] };
      salesQuantityData.push(q);
    }

    this.setState({
      sumSales: totalPrice,
      salesQuantityData: salesQuantityData,
      salesAmountData: salesAmountData,
      dailyRevenue: dailyRevenue,
    });
  };

  handleStartChooseDate = () => {
    const { isChooseDate } = this.state;
    this.setState({
      isChooseDate: !isChooseDate,
    });
  };

  handleRangeChange = (payload) => {
    const { startDate, endDate } = payload.selection;
    let newD = new Date(new Date(endDate).getTime() + 864e5);
    this.setState({
      selectionRange: {
        ...payload.selection,
        startDate,
        endDate,
      },
    });
    this.updateData(startDate, newD);
  };

  render() {
    // layout is an array of objects, see the demo for more complete usage
    const {
      orders,
      isChooseDate,
      selectionRange,
      sumSales,
      salesQuantityData,
      salesAmountData,
      dailyRevenue,
    } = this.state;
    const layout = [
      { i: 'a', x: 0, y: 0, w: 4, h: 9, minW: 4, useCSSTransforms: false, static: true },
      { i: 'b', x: 4, y: 0, w: 4, h: 9, minW: 4, useCSSTransforms: false, static: true },
      { i: 'c', x: 8, y: 0, w: 4, h: 9, minW: 4, useCSSTransforms: false, static: true },
      { i: 'd', x: 0, y: 9, w: 12, h: 13, minW: 12, useCSSTransforms: false, static: true },
    ];
    if (!this.state.isMounted) {
      return null;
    } //totalSales

    const parseDateToString = (date) => {
      let currentDate = new Date(date);
      return currentDate
        .toLocaleDateString('en-ZA', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
        .split(' ')
        .join(' ');
    };

    // colors used for the pie charts
    const colorsArray = Object.values(defaultTheme.pieChartColors);

    return (
      <>
        <StyledBreadCrumbsContainer>
          <Row>
            <Col span={12}>
              <PieChartOutlined style={{ padding: '10px' }} />
              Dashboard
            </Col>
            <StyledButton variant="outlined" onClick={this.handleStartChooseDate}>
              <Icons src={dateRangeLogo} />
              {parseDateToString(selectionRange.startDate)} {'  -  '}
              {parseDateToString(selectionRange.endDate)}
            </StyledButton>
            {isChooseDate && (
              <DatePickGroup>
                <CloseButton onClick={this.handleStartChooseDate}>&times;</CloseButton>
                <DateRangePicker
                  ranges={[selectionRange]}
                  editableDateInputs={true}
                  onChange={this.handleRangeChange}
                />
              </DatePickGroup>
            )}
          </Row>
        </StyledBreadCrumbsContainer>
        <StyledContainer
          className="layout"
          layout={layout}
          isResizable={false}
          useCSSTransforms={false}
          isDraggable={false}
          cols={12}
          rowHeight={30}
          width={1200}
        >
          <StyledDiv key="a" index={0}>
            <StyledTitleContainer>Total Sales</StyledTitleContainer>
            <ResponsiveContainer width="90%" height="90%">
              <StyledTotalSalesContainer>{`$${sumSales.toFixed(2)}`}</StyledTotalSalesContainer>
            </ResponsiveContainer>
          </StyledDiv>
          <StyledDiv key="b" index={1}>
            <StyledTitleContainer>Sales Quantity Breakdown</StyledTitleContainer>
            <ResponsiveContainer width="90%" height="90%">
              <PieChart>
                {orders.length > 0 ? (
                  <Pie
                    data={salesQuantityData}
                    labelLine={false}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={60}
                    startAngle={0}
                    endAngle={360}
                    activeIndex={this.state.activeIndexSalesQuantity}
                    activeShape={renderActiveShapeSalesQuantity}
                    onMouseEnter={this.onSalesQuantityPieEnter}
                  >
                    {salesQuantityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colorsArray[index]} />
                    ))}
                  </Pie>
                ) : (
                  <div>No products sold yet.</div>
                )}
              </PieChart>
            </ResponsiveContainer>
          </StyledDiv>
          <StyledDiv key="c" index={2}>
            <StyledTitleContainer>Sales Amount Breakdown</StyledTitleContainer>
            <ResponsiveContainer width="90%" height="90%">
              <PieChart>
                {orders.length > 0 ? (
                  <Pie
                    data={salesAmountData}
                    labelLine={false}
                    dataKey="value"
                    nameKey="name"
                    startAngle={360}
                    endAngle={0}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={60}
                    activeIndex={this.state.activeIndexSalesAmount}
                    activeShape={renderActiveShapeSalesAmount}
                    onMouseEnter={this.onSalesAmountPieEnter}
                  >
                    {salesAmountData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colorsArray[index]} />
                    ))}
                  </Pie>
                ) : (
                  <div>No products sold yet.</div>
                )}
              </PieChart>
            </ResponsiveContainer>
          </StyledDiv>
          <StyledDivBottom key="d">
            <StyledTitleContainer style={{ marginLeft: '10px' }}>Daily Revenue</StyledTitleContainer>
            <Linechart data={dailyRevenue} />
          </StyledDivBottom>
        </StyledContainer>
      </>
    );
  }
}
