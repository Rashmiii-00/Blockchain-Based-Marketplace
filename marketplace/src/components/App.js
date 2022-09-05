import React, { Component } from "react";
import Web3 from "web3";
import logo from "../logo.png";
import "./App.css";
import Marketplace from "../abis/Marketplace.json";
import Navbar from "./Navbar";
import Main from "./Main";

class App extends Component {
  // --- to make API calls once the component is initiated and configure the values into the state -----
  async componentWillMount() {
    await this.loadWeb3();
    // console.log(window.web3);
    await this.loadBlockchainData();
  }

  // ---- first step is to load web3 - METAMASK -------
  // follow metamask article for this.
  async loadWeb3() {
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    }
    // Non-dapp browsers...
    else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }

  // --------- load blockchain and smart contract info
  async loadBlockchainData() {
    const web3 = window.web3;
    // load account
    const accounts = await web3.eth.getAccounts();
    // get the actual accountt address
    this.setState({ account: accounts[0] });
    // it should automatically retract the network on which smart contract is deployed.
    const networkId = await web3.eth.net.getId();
    const networkData = Marketplace.networks[networkId];
    // to fetch the contrat, we need to give the json interface and address/
    if (networkData) {
      const marketplace = web3.eth.Contract(
        Marketplace.abi,
        networkData.address
      );
      // console.log(marketplace);
      this.setState({ marketplace });
      // for fetching the count of products
      const productCount = await marketplace.methods.productCount().call();
      this.setState({ productCount });
      // load products
      for (var i = 1; i <= productCount; i++) {
        const product = await marketplace.methods.products(i).call();
        this.setState({
          products: [...this.state.products, product],
        });
      }
      // show loading until the data is ready to be displayer after being confirmed by metamask and ganache
      this.setState({ loading: false });
    } else {
      window.alert("Contract is not deployed to detected network");
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      account: "",
      productCount: 0,
      products: [],
      loading: true,
    };

    this.createProduct = this.createProduct.bind(this);
    this.purchaseProduct = this.purchaseProduct.bind(this);
  }

  createProduct(name, price) {
    this.setState({ loading: true });
    this.state.marketplace.methods
      .createProduct(name, price)
      .send({ from: this.state.account })
      .once("receipt", (receipt) => {
        this.setState({ loading: false });
      });
  }

  purchaseProduct(id, price) {
    this.setState({ loading: true });
    this.state.marketplace.methods
      .purchaseProduct(id)
      .send({ from: this.state.account, value: price })
      .once("receipt", (receipt) => {
        this.setState({ loading: false });
      });
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              {this.state.loading ? (
                <div id="loader" className="text-center">
                  <p className="text-center">Loading...</p>
                </div>
              ) : (
                <Main
                  products={this.state.products}
                  createProduct={this.createProduct} // this is only passing, function will be called in Main.js with parameters
                  purchaseProduct={this.purchaseProduct}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
