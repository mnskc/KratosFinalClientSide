document.getElementById('main-screen').style.display="none";

const create_safe_button = document.getElementById('create-safe-button');
create_safe_button.addEventListener('click',screenchangetomain);
async function screenchangetomain()
{
    document.getElementById('main-screen').style.display="block";
    document.getElementById('transaction-screen').style.display="block";
    document.getElementById('invest-screen').style.display ="none";
    document.getElementById('swap-screen').style.display ="none";
    document.getElementById('all-orders-screen').style.display ="none";
    document.getElementById('welcome-screen').style.display ="none";
    document.getElementById('profile-screen').style.display ="none";
    await checkAndCreateSafe();
    await checkBalance();
    await viewTransaction();
}

//transaction pages button are here....
const transaction_button = document.getElementById('transaction-button');
transaction_button.addEventListener('click',screenchangetotransaction1);
function screenchangetotransaction1()
{
    document.getElementById('transaction-screen').style.display="block";
    document.getElementById('invest-screen').style.display ="none";
    document.getElementById('swap-screen').style.display ="none";
    document.getElementById('all-orders-screen').style.display ="none";
    document.getElementById('profile-screen').style.display ="none";
}

// investment page buttons are here...

const invest_button = document.getElementById('invest-button');
invest_button.addEventListener('click',screenchangetoinvest);

function screenchangetoinvest()
{
    document.getElementById('transaction-screen').style.display="none";
    document.getElementById('swap-screen').style.display ="none";
    document.getElementById('all-orders-screen').style.display ="none";
    document.getElementById('invest-screen').style.display ="block";
    document.getElementById('profile-screen').style.display ="none";
}

const swap_button = document.getElementById('swap-button');
swap_button.addEventListener('click',screenchangetoswap);

function screenchangetoswap()
{
    document.getElementById('invest-screen').style.display="none";
    document.getElementById('transaction-screen').style.display="none";
    document.getElementById('all-orders-screen').style.display ="none";
    document.getElementById('swap-screen').style.display ="block";
    document.getElementById('profile-screen').style.display ="none";
}

const all_orders_button = document.getElementById('all-orders-button');
all_orders_button.addEventListener('click',screenchangetoallorders);

function screenchangetoallorders()
{
    document.getElementById('invest-screen').style.display="none";
    document.getElementById('transaction-screen').style.display="none";
    document.getElementById('swap-screen').style.display ="none";
    document.getElementById('all-orders-screen').style.display ="block";
    document.getElementById('profile-screen').style.display ="none";
}

const profile_button = document.getElementById('profile-button');
profile_button.addEventListener('click',screenchangetoallprofile);
function screenchangetoallprofile()
{
    document.getElementById('invest-screen').style.display="none";
    document.getElementById('transaction-screen').style.display="none";
    document.getElementById('swap-screen').style.display ="none";
    document.getElementById('all-orders-screen').style.display ="none";
    document.getElementById('profile-screen').style.display ="block";
}



// All logic below

const {ethers , BigNumber, Signer}  = require("ethers");
const { SafeTransactionDataPartial } = require('@gnosis.pm/safe-core-sdk-types');
const { SafeFactory, SafeAccountConfig, ContractNetworksConfig } = require('@gnosis.pm/safe-core-sdk');
const Safe = require('@gnosis.pm/safe-core-sdk')["default"];
const web3Provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/511886e2af2a4dfa89ed2b80a94692b1');
const EthersAdapter = require('@gnosis.pm/safe-ethers-lib')["default"];


//Global variables used
let wallet_signer , relayer , provider , addressOfSafe;

// ADDRESS AND ABI OF CONTRACTS...
const UserMappingSmartContractAddress = "0x5eee90B939F5fF2a6fA90265B64284dCaB2C031a" , dai_address = "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa" , cDAI_ADDRESS = "0x6D7F0754FFeb405d23C51CE938289d4835bE3b14" , uniswap_address="0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" , link_address = "0x01BE23585060835E02B77ef475b0Cc51aA1e0709" , relayer_owner_address ="0x47808B1b63390e7fB84818E826f154385821a1e7" , relayer_private_key = "fcdc201c21f2ee32b116c24ea793bb3c662747a66cd486bd23efd339fd0d104c";

const UserMappingAbi = [
    "function getAddress(address) public view returns (address)",
    "function addAddress(address , address) public"
]

const erc20Abi = [
    "function balanceOf(address account) public view returns (uint256)",
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function approve(address spender, uint tokens)public returns (bool success)"
];

const uniswap_abi = [
    "function swapExactTokensForTokens( uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

const cerc20Abi = [
    "function balanceOf(address account) public view returns (uint256)",
    "function mint(uint256 mintAmount) public",
    "function redeemUnderlying(uint256 redeemAmount) public"
];

//PROVIDERS AND RELAYERS ADDRESS...

provider = new ethers.providers.Web3Provider(window.ethereum);
relayer = new ethers.Wallet(relayer_private_key, web3Provider); 
wallet_signer = provider.getSigner();

document.getElementById('metamask-wallet').addEventListener('click',openWallet);

async function openWallet()
{
    // to generate a metamask popup on UI
    await provider.send("eth_requestAccounts", []);
    // to retreive address of the user
    const user_address = await wallet_signer.getAddress();
    document.getElementById('metamask-wallet').innerText = "Connected"; 
    document.getElementById('user_address_span').innerText=`${user_address}`;
}

async function checkAndCreateSafe()
{
    await provider.send("eth_requestAccounts", []);
    // creating a relayer adapter to create a safe factory object
    const relayer_adapter = new EthersAdapter({ethers , signer: relayer});
    const user_address = await wallet_signer.getAddress();
    if(user_address != null){
        document.getElementById('metamask-wallet').innerText = "Connected"; 
    }
    else{
        alert("Please create a safe You Don't have any safe Linked with Kratos")
    }
    // Self deployed smart contract storing a mapping of each user with its corresponding safe address
    const UserMappingSmartContract = new ethers.Contract(UserMappingSmartContractAddress, UserMappingAbi, relayer);
    // to get safe address corresponding to this user
    const to_get_user = await UserMappingSmartContract.getAddress(user_address,{gasLimit:150000});
    // zero address is returned if safe address does not exist
    if(to_get_user == 0x0000000000000000000000000000000000000000){                    
        const safeFactory = await SafeFactory.create({ ethAdapter: relayer_adapter });
        const owners = [user_address , relayer_owner_address];
        const threshold = 2;
        const safeAccountConfig = { owners: owners, threshold: threshold};
        const safeSdk = await safeFactory.deploySafe({ safeAccountConfig });
        const newSafeAddress = await safeSdk.getAddress();
        // updating entry since new safe has been deployed for the user
        const tx = await UserMappingSmartContract.addAddress(user_address,newSafeAddress,{gasLimit:150000});
        console.log(tx);
        await tx.wait();
        console.log("Success Added.....");
        console.log("The address of the safe is" + newSafeAddress);
        let d = "Your Safe Address is  :  " + user_address;
        addressOfSafe = newSafeAddress;
        console.log(addressOfSafe);
        document.getElementById('trx-from-address').innerText = addressOfSafe;
        document.getElementById('profile-safe-address').innerText = addressOfSafe;  
    }
    else{
        // this means safe already exists
        addressOfSafe = to_get_user;
        console.log(addressOfSafe);
        document.getElementById('trx-from-address').innerText = addressOfSafe;
        document.getElementById('profile-safe-address').innerText = addressOfSafe; 
    }
}

async function checkBalance()
{
    console.log("safe address is : " + addressOfSafe);
    const signer = provider.getSigner();
    // creating dai and link smart contract instance to fetch balance of both tokens in safe
    const dai_contract = new ethers.Contract(dai_address, erc20Abi, signer);
    const link_contract = new ethers.Contract(link_address , erc20Abi , signer);
    let daiBalance = await dai_contract.balanceOf(addressOfSafe);
    // formating value received according to the 18 decimals in dai
    let daiBalance1 = ethers.utils.formatUnits(daiBalance , 18);
    daiBalance1 = parseFloat(daiBalance1);
    let linkBalance = await link_contract.balanceOf(addressOfSafe);
    // formatting the value received according to the 18 decimals in link
    let linkBalance1 = ethers.utils.formatUnits(linkBalance , 18);
    daiBalance1 = parseFloat(daiBalance1);
    linkBalance1 = parseFloat(linkBalance1);
    // for updation in UI
    let i = "DAI BALANCE : " + daiBalance1;
    let j = "LINK BALANCE : " + linkBalance1;
    document.getElementById('trx-dai-balance').innerText = i;
    document.getElementById('invest-dai-balance').innerText = i;
    document.getElementById('swap-dai-balance').innerText =`${i}\n${j}`;

    // for fetching cDai Balance
    const cDaiSmartContract = new ethers.Contract(cDAI_ADDRESS, cerc20Abi, signer);
    let cdaiBalance = await cDaiSmartContract.balanceOf(addressOfSafe);
    cdaiBalance = ethers.utils.formatUnits(cdaiBalance , 8);
    cdaiBalance = parseFloat(cdaiBalance)/42;
    console.log(cdaiBalance);
    let r="REDEEM BALANCE : " + cdaiBalance;
    document.getElementById('redeem-dai-balance').innerText =r;
}

async function viewTransaction()
{
    let res;
    const address = addressOfSafe;
    // etherscan Api.....api key
    const apiKey = 'WFRP1M8II5Y9EKAGST1YRGGXCRH4YNY1XF';
    const etherscan_endpoint = `https://api-rinkeby.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`;
    await fetch(etherscan_endpoint , {
        method: 'GET'
    }).then(res => {
        return res.json()
    }).then((data) => {
        res = data.result;
    })
    .catch(error => console.log('error'))
    res.reverse();
    var list = document.getElementById('list');
    list.innerHTML="";
    for(let i = 0 ; i < res.length ; i++){
        const r = res[i];
        const from = r.from;
        const to = r.to;
        const value = r.value;
        const url = `https://rinkeby.etherscan.io/tx/${r.hash}`
        const li = document.createElement('li');
        li.className = "list-group-item";
        const len = res.length;
        const timestamp = r.timeStamp;
        const status=r.txreceipt_status;
        const currTime = parseInt(Date.now())/1000;
        var time = currTime - timestamp;
        var secondsAgo = parseInt(time);
        var minuteAgo = secondsAgo/60;
        var hoursAgo = minuteAgo/60;
        secondsAgo = secondsAgo%60;
        minuteAgo = minuteAgo%60;
        secondsAgo = parseInt(secondsAgo);
        minuteAgo = parseInt(minuteAgo);
        hoursAgo = parseInt(hoursAgo);
        var timeDisplayed = `${secondsAgo}s ago`;
        if(minuteAgo > 0){
            timeDisplayed = `${minuteAgo}m ` + timeDisplayed
        }
        if(hoursAgo > 0){
            timeDisplayed = `${hoursAgo}h ` + timeDisplayed
        }
        secondsAgo = parseInt(secondsAgo);
        li.innerText = `Transaction Number: ${res.length - i}\n Transaction Hash: ${r.hash} \n Time Of Transaction : ${timeDisplayed} \n`;
        const a = document.createElement('a');
        a.href = url;
        if(status=="1")
        {
            a.innerText = `View Successful Transaction`;
            li.style.backgroundColor="#C7E3BD";
        }else{
            a.innerText = `View Failed Transaction`;
            li.style.backgroundColor="#F0B1AC";
        }
        a.target = '_blank';
        li.appendChild(a);
        list.appendChild(li);
    }
}

// this function is used for creation of safe sdk object with relayer as the signer...
// any transaction that is performed using this object will require the gas to be paid by the relayer
async function createSafeSdkForRelayer()
{
    const relayer_adapter = new EthersAdapter({ethers,signer:relayer});
    const safesdk = await Safe.create({ethAdapter:relayer_adapter,safeAddress :addressOfSafe});
    return safesdk;
}

// similarly this function is used for creation of safe sdk object with the owner as the signer...
async function createSafeSdkForOwner()
{
    const wallet_signer1 = provider.getSigner();
    const owner_adapter1 = new EthersAdapter({ethers , signer: wallet_signer1});
    const safeSdk_owner = await Safe.create({ethAdapter : owner_adapter1,safeAddress: addressOfSafe});
    return safeSdk_owner;
}

document.getElementById("send-transaction-button").addEventListener('click',sendTransaction);
// this function is for sending dai tokens to any other address
async function sendTransaction()
{
    checkAndCreateSafe();
    document.getElementById("transaction-status-text").innerText = "Transaction status: Starting...";
    const address_to_send = document.getElementById("trx-screen-address-input").value;
    const fetch_value = document.getElementById("trx-screen-token-input").value;
    console.log(fetch_value);
    const token_to_send = ethers.utils.parseUnits(fetch_value , 18);
    console.log(token_to_send);

    console.log(token_to_send +" -> "+ address_to_send);
    
    //relayer safesdk is created here..
    const safesdk = await createSafeSdkForRelayer();

    //owner safesdk is created here....
    const safeSdkowner = await createSafeSdkForOwner();

    const dai_contract = new ethers.Contract(dai_address, erc20Abi, relayer);
    document.getElementById("transaction-status-text").innerText="Transaction status: Encoding Transaction...";

    // building a dummy transaction since we need to retreive the data for the transaction that needs to be send
    const dataForTransaction = await dai_contract.populateTransaction["transfer"](address_to_send , token_to_send);

    const nonce = await safesdk.getNonce();

    const tx = {
        to: dai_address,
        data: dataForTransaction.data, // the dummy transaction that we build above is used here in the data field
        value: 0,
        nonce:nonce,
        gasLimit:250000
    }

    await executeTransaction(tx);
}


//for lending to the compound protocol is done here.....

document.getElementById("lend-token-button").addEventListener('click',lendMoney);
async function lendMoney()
{
    checkAndCreateSafe();
    document.getElementById("lend-status-text").innerText="Transaction status: Starting...";
    const fetch_value = document.getElementById("lend-token-input").value;

    const token_to_send = ethers.utils.parseUnits(fetch_value , 18);

    //relayer safesdk is created here..
    const safesdk = await createSafeSdkForRelayer();

    //owner safesdk is created here....
    const safeSdkowner = await createSafeSdkForOwner();

    const ercDAI = new ethers.Contract(dai_address, erc20Abi, relayer);
    const erccDAI = new ethers.Contract(cDAI_ADDRESS, cerc20Abi, relayer);

    document.getElementById("lend-status-text").innerText="Transaction status: Seeking Token Approval...";
    
    // building dummy transations to pass in data field in the actual transaction
    const approveDAI = await ercDAI.populateTransaction.approve(cDAI_ADDRESS,token_to_send);
    const approvecDAI = await erccDAI.populateTransaction.mint(token_to_send);

    document.getElementById("lend-status-text").innerText="Transaction status: Token Approval Done...";

    const tx = [
        {
            to: dai_address,    // first approval for dai to get transfered....
            value: "0",
            data:approveDAI.data,
        },
        {
            to: cDAI_ADDRESS,
            value: "0",
            data:approvecDAI.data,
        },
    ];

    await executeTransaction(tx);
}

// for redeeming from compound protocol is done here....

const redeem_send_button= document.getElementById("redeem-token-button");
redeem_send_button.addEventListener('click',redeemMoney);

async function redeemMoney()
{
    checkAndCreateSafe();
    console.log(addressOfSafe);
    document.getElementById("redeem-status-text").innerText="Transaction status: Starting...";
    const fetch_value=document.getElementById("redeem-token-input").value;
    console.log(fetch_value);
    const token_to_send=ethers.utils.parseUnits(fetch_value , 18);
    console.log(token_to_send);

    console.log(token_to_send +" dai ");

    //relayer safesdk is created here..
    const safesdk = await createSafeSdkForRelayer();

    //owner safesdk is created here....
    const safeSdkowner = await createSafeSdkForOwner();

    const erccDAI = new ethers.Contract(cDAI_ADDRESS, cerc20Abi, relayer);

    document.getElementById("redeem-status-text").innerText="Transaction status: Seeking Token Approval...";
    
    const redeemDAI = await erccDAI.populateTransaction.redeemUnderlying(token_to_send);
    document.getElementById("redeem-status-text").innerText="Transaction status: Token Approval Done...";
   
    const tx = 
    {
        to: cDAI_ADDRESS,
        value: "0",
        data:redeemDAI.data,
        gasLimit:160000
    };
    await executeTransaction(tx);
}

//swap of tokens using uniswap is done here....

const swap_send_button = document.getElementById("swap-token-button");
swap_send_button.addEventListener('click',swapMoney);

async function swapMoney()
{
    checkAndCreateSafe();
    console.log(addressOfSafe);
    document.getElementById("swap-status-text").innerText="Transaction status: Starting...";
    const fetch_value = document.getElementById("swap-token-input").value;
    console.log(fetch_value);
    const token_to_send=ethers.utils.parseUnits(fetch_value , 18);
    console.log(token_to_send);

    console.log(token_to_send +" dai ");

    //relayer safesdk is created here
    const safesdk = await createSafeSdkForRelayer();

    //owner safesdk is created here
    const safeSdkowner = await createSafeSdkForOwner();

    const uniswapcontract = new ethers.Contract(uniswap_address, uniswap_abi, relayer);
    const ercDAI = new ethers.Contract(dai_address, erc20Abi, relayer);

    document.getElementById("swap-status-text").innerText="Transaction status: Seeking Token Approval...";
    
    const path = [dai_address , link_address];
    const deadline = Math.floor(Date.now()/1000 +180000);
    const dataForTransaction = await ercDAI.populateTransaction["approve"](uniswap_address , token_to_send.toString());
    
    const tx1={
            to: dai_address,
            value: 0,
            data:dataForTransaction.data,
            gasLimit:250000
    }

    const safeTransaction = await safesdk.createTransaction(tx1);
    const relayerSignature_approve=await safesdk.signTransaction(safeTransaction);
    const ownerSignature_approve=await safeSdkowner.signTransaction(safeTransaction);

    const txResponse_owner1 = await safesdk.executeTransaction(safeTransaction);
    await txResponse_owner1.transactionResponse.wait();
    const uniswap_data = await uniswapcontract.populateTransaction["swapExactTokensForTokens"](token_to_send.toString() , '0' , path, addressOfSafe , deadline);
    document.getElementById("swap-status-text").innerText="Transaction status: Token Approval Done...";
   
    const tx = 
        {
        from: addressOfSafe,
        to: uniswap_address,
        value: 0,
        data:uniswap_data.data,
        gasLimit:250000
    }
    await executeTransaction(tx);
}

// utility function created just for adding text to transaction status at bottom of UI
function addTextToStatus(text){
    const examples = document.querySelectorAll('.transaction-status-common');
    examples.forEach(example => {
        example.innerHTML = text;
    });
}

// utility function for sending a transaction using the safe
async function executeTransaction(tx){
    const safesdk = await createSafeSdkForRelayer();
    const safeSdkowner = await createSafeSdkForOwner();
    const safeTransaction1 = await safesdk.createTransaction(tx);
    const element = document.getElementsByClassName('transaction-status-common');
    addTextToStatus("Transaction status: Sending from Your Safe...")
    const relayerSignature=await safesdk.signTransaction(safeTransaction1);
    addTextToStatus("Transaction status: Asking For Your Approval...")
    const ownerSignature=await safeSdkowner.signTransaction(safeTransaction1);
    addTextToStatus("Transaction status: User Approval Confirmed...")
    const txResponse_owner = await safesdk.executeTransaction(safeTransaction1);
    addTextToStatus("Transaction status: Processing Your Transaction...")
    await txResponse_owner.transactionResponse.wait();
    addTextToStatus("Transaction status: Transaction Completed")
    console.log("The hash of tx is :"+txResponse_owner.hash);
    document.getElementById("swap-token-input").value = "";
    checkBalance();
}