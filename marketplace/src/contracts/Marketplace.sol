pragma solidity >=0.5.0;

contract Marketplace {

    string public name; // state variable, just like a class variable. can be accessed by the whole contract
    uint public productCount = 0;
    mapping(uint => Product) public products;
    struct Product{
        uint id;
        string name;
        uint price;
        address payable owner;
        bool purchased;
    }

    event ProductCreated (
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    event ProductPurchased (
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    constructor() public {
        name = "Dapp Univeristy Marketplace";
    }

    function createProduct(string memory _name, uint _price) public {
        // -----make sure parameters are correct----
        // name ls not blank
        require(bytes(_name).length > 0);
        // price is positive
        require(_price > 0);

        // ----increment product----
        productCount ++;

        // ----create product---
        products[productCount] = Product(productCount, _name, _price, msg.sender, false);

        // ----trigger event---
        emit ProductCreated(productCount, _name, _price, msg.sender, false);
    }

    function purchaseProduct(uint _id) public payable{
        // fetch product
        Product memory _product = products[_id];
        // fetch owner
        address payable _seller = _product.owner;
        // Require is is valid
        // require(_product.id > 0 && _product.id <= productCount);
        require(_id >0 && _id <= productCount);
        // require enough ether to buy
        require(msg.value >= _product.price);
        // require product is not already sold
        require(!_product.purchased);
        // require buyer is not seller
        require(_seller != msg.sender);
        // purchase it and transfer ownership
        _product.owner = msg.sender;
        _product.purchased = true;
        // update product
        products[_id] = _product;
        // pay seller
        address(_seller).transfer(msg.value);
        // trigger an evvent
         emit ProductPurchased(productCount, _product.name, _product.price, msg.sender, true);
    }
}