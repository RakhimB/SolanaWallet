const { Keypair, Connection, PublicKey, Transaction, sendAndConfirmTransaction, SystemProgram } = require('@solana/web3.js');
const fs = require('fs');


function createWallet() {
    const wallet = Keypair.generate();
    const walletInfo = {
        privateKey: wallet.secretKey.toString(),
        publicKey: wallet.publicKey.toString(),
        balance: 0
    };

    fs.writeFileSync('wallet.json', JSON.stringify(walletInfo, null, 2));
    console.log('Wallet created and saved to wallet.json');
}


function airdrop(amount = 1) {
    const walletInfo = JSON.parse(fs.readFileSync('wallet.json', 'utf-8'));
    const connection = new Connection('https://api.devnet.solana.com');

    connection.requestAirdrop(new PublicKey(walletInfo.publicKey), amount * 10 ** 9)
        .then((res) => {
            console.log(`Airdrop successful. Transaction signature: ${res}`);
        })
        .catch((err) => {
            console.error('Airdrop failed:', err);
        });
}


function checkBalance() {
    const walletInfo = JSON.parse(fs.readFileSync('wallet.json', 'utf-8'));
    const connection = new Connection('https://api.devnet.solana.com');

    connection.getBalance(new PublicKey(walletInfo.publicKey))
        .then((balance) => {
            console.log(`Wallet balance: ${balance / 10 ** 9} SOL`);
        })
        .catch((err) => {
            console.error('Failed to get balance:', err);
        });
}

function transfer(otherPublicKey, amount) {
    const walletInfo = JSON.parse(fs.readFileSync('wallet.json', 'utf-8'));
    const connection = new Connection('https://api.devnet.solana.com');

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: new PublicKey(walletInfo.publicKey),
            toPubkey: new PublicKey(otherPublicKey),
            lamports: amount * 10 ** 9 
        })
    );

    sendAndConfirmTransaction(connection, transaction, [Keypair.fromSecretKey(new Uint8Array(Buffer.from(walletInfo.privateKey, 'base64')))])
        .then(() => {
            console.log(`Transfer successful. ${amount} SOL sent to ${otherPublicKey}`);
        })
        .catch((err) => {
            console.error('Transfer failed:', err);
        });
}


const command = process.argv[2];

switch (command) {
    case 'new':
        createWallet();
        break;
    case 'airdrop':
        const amount = parseInt(process.argv[3]) || 1;
        airdrop(amount);
        break;
    case 'balance':
        checkBalance();
        break;
    case 'transfer':
        const otherPublicKey = process.argv[3];
        const transferAmount = parseFloat(process.argv[4]);
        transfer(otherPublicKey, transferAmount);
        break;
    default:
        console.error('Invalid command. Please use "new", "airdrop", "balance", or "transfer".');
}
