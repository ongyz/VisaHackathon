import React from 'react';
import { Link } from 'react-router-dom';
import PaymentProductCard from '../../Components/Cards/PaymentProductCard';
import PaymentForm from './PaymentForm';
import { Row, Col, Layout, message, Typography, Radio, Tooltip } from 'antd';
import { QuestionCircleFilled } from '@ant-design/icons';
import queryString from 'query-string';
import { defaultTheme } from '../../utils/theme';
import API, { baseUrl } from '../../utils/baseUrl';
import { ShopOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import CheckoutPaymentForm from './CheckoutPaymentForm';
const { Content } = Layout;
const { Title } = Typography;

const ErrorMessageContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, 0);
  font-size: 16px;
`;

const StyledRadioGroup = styled(Radio.Group)`
  margin-bottom: 5%;
`;

export default class Payment extends React.Component {
  constructor(props) {
    super(props);
    const queries = queryString.parse(this.props.location.search);
    this.state = {
      merchantId: this.props.match.params.merchantId,
      productId: this.props.match.params.productId,
      isOwnerShop: this.props.match.params.merchantId === this.props.loggedInUserId,
      product: null,
      merchant: null,
      qty: queries.qty,
      offers: [],
      radioValue: 0,
    };
  }

  getMerchantOffersFromApi = (merchantId) => {};

  componentDidMount = () => {
    API.get(`api/product/get?id=${this.state.productId}`)
      .then((res) => {
        if (res.data.success) {
          this.setState({ product: res.data.product });
        } else {
          message.error({
            content: `Invalid product id of '${this.state.productId}'`,
            duration: 5,
          });
        }
      })
      .catch((err) => console.error(err));

    API.get(`api/merchant/get?id=${this.state.merchantId}`)
      .then((res) => {
        this.setState({ merchant: res.data.merchant });
      })
      .catch((err) => console.error(err));

    API.get(`api/offers/visell/getByMerchant?merchantId=${this.state.merchantId}`)
      .then((res) => {
        this.setState({ offers: res.data.offers });
      })
      .catch((err) => console.error(err));
  };

  getSinglePaymentMethodComponent = (product, qty, merchantId, productId, totalPrice) => {
    return (
      <Col lg={{ span: 14 }} span={24} style={{ minHeight: 300 }}>
        <Row style={{ justifyContent: 'center' }}>
          <Title level={4} style={{ color: `${defaultTheme.colors.primary}`, marginBottom: '10%', fontSize: '32px' }}>
            Visa Checkout
          </Title>
        </Row>
        <CheckoutPaymentForm
          merchantId={merchantId}
          productId={productId}
          qty={qty}
          totalPrice={totalPrice}
          shippingFee={product.shippingFee || 2}
          history={this.props.history}
        />
      </Col>
    );
  };

  getBothPaymentMethodComponent = (product, qty, merchantId, productId, totalPrice) => {
    return (
      <Col lg={{ span: 14 }} span={24} style={{ minHeight: 300 }}>
        <Row style={{ justifyContent: 'center' }} align="center">
          <StyledRadioGroup
            onChange={(event) => this.setState({ radioValue: event.target.value })}
            value={this.state.radioValue}
          >
            <Radio value={0}>
              Visa Direct&nbsp;
              <Tooltip title="Visa Direct payment involves paying on the current website">
                <QuestionCircleFilled />
              </Tooltip>
            </Radio>
            <Radio value={1}>
              Visa Checkout&nbsp;
              <Tooltip title="Visa Checkout payment involves a seperate registration and login on Visa's checkout platform">
                <QuestionCircleFilled />
              </Tooltip>
            </Radio>
          </StyledRadioGroup>
        </Row>
        {this.state.radioValue === 0 && (
          <PaymentForm
            merchantId={merchantId}
            productId={productId}
            qty={qty}
            totalPrice={totalPrice}
            shippingFee={product.shippingFee || 2}
            history={this.props.history}
          />
        )}
        {this.state.radioValue === 1 && (
          <CheckoutPaymentForm
            merchantId={merchantId}
            productId={productId}
            qty={qty}
            totalPrice={totalPrice}
            shippingFee={product.shippingFee || 2}
            history={this.props.history}
          />
        )}
      </Col>
    );
  };

  render() {
    const { product, qty, merchantId, productId, merchant, isOwnerShop } = this.state;
    const { isLoggedIn } = this.props;

    if (product == null || merchant == null) {
      // when product or merchant isn't populated yet
      return null;
    }

    if (isLoggedIn) {
      return (
        <ErrorMessageContainer>
          To make payments, you must be logged out as a normal user instead of a merchant.
        </ErrorMessageContainer>
      );
    }

    let headerName;

    if (isOwnerShop) {
      headerName = 'My Shop';
    } else {
      headerName = merchant.name;
    }

    const totalPrice = (product.price * qty).toFixed(2);
    return (
      <Content style={{ maxWidth: '1280px', minWidth: '1280px', margin: '0 auto', marginTop: '5vh' }}>
        <Row align="top" justify="space-between" style={{ margin: '0 0 50px 0' }}>
          <Title level={4} style={{ color: '#828282' }}>
            <Link to={'/'} style={{ color: '#828282' }}>
              <ShopOutlined /> {headerName}
            </Link>{' '}
            /{' '}
            <Link to={`/${merchantId}/product/${productId}`} style={{ color: '#828282' }}>
              {product.name}
            </Link>{' '}
            / Payment
          </Title>
        </Row>
        <Row align="middle">
          <Col lg={{ span: 10 }} span={24}>
            <PaymentProductCard
              imageUrl={`${baseUrl}${product.images[0]}`}
              qty={qty}
              price={product.price.toFixed(2)}
              title={product.name}
            />
          </Col>
          {merchant.binNo
            ? this.getBothPaymentMethodComponent(product, qty, merchantId, productId, totalPrice)
            : this.getSinglePaymentMethodComponent(product, qty, merchantId, productId, totalPrice)}
        </Row>
      </Content>
    );
  }
}
