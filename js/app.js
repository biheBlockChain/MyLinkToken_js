var wallet = 'wallet';
var password = 'password';
var to_address = 'to_address';
var to_num = 'to_num';

chrome.storage.sync.get({
    [wallet]: null,
    [password]: null,
    [to_address]: null,
    [to_num]: null,
}, function (result) {
    $("#wallet").val(result.wallet);
    $("#password").val(result.password);
    $("#to_address").val(result.to_address);
    $("#to_num").val(result.to_num);
});

function SaveConfig() {
    chrome.storage.sync.set({
        [wallet]: $("#wallet").val(),
        [password]: $("#password").val(),
        [to_address]: $("#to_address").val(),
        [to_num]: $("#to_num").val(),
    }, function (result) {

    })
};

$("input").change(SaveConfig);
$("#send").click(function () {
    SaveConfig();
    var web3 = new Web3();

    var wallet = $("#wallet").val();
    var password = $("#password").val();
    var to_address = $("#to_address").val();
    var to_num = $("#to_num").val();

    var wallet_new = ethereumjs.Wallet.fromV3(wallet, password);//json+pwd解密钱包文件
    var from = `0x${wallet_new.getAddress().toString('hex')}`;
    num = Number(to_num).toFixed(8);
    $.ajax({
        type: 'POST',
        url: "https://walletapi.onethingpcs.com/",
        data: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "eth_getTransactionCount",//返回交易次数，只计算转出的次数
            "params": [from, "pending"],
            "id": 1
        }),
        contentType: 'application/json',
        success: function (TransactionCount) {
            let txParams = {
                from: from,
                to: to_address,
                value: web3.toHex(web3.toWei(num)),
                gasLimit: '0x186a0',
                gasPrice: '0x174876e800',
                nonce: TransactionCount.result,
            };
            let tx = new ethereumjs.Tx(txParams);
            tx.sign(wallet_new.getPrivateKey());
            var serializedTx = tx.serialize();
            var raw = `0x${serializedTx.toString('hex')}`;
            $.ajax({
                type: 'POST',
                url: "https://walletapi.onethingpcs.com/",
                beforeSend: function (XMLHttpRequest) {
                    XMLHttpRequest.setRequestHeader("Nc", "IN");
                },
                data: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "eth_sendRawTransaction",
                    "params": [raw],
                    "id": 1,
                    "Nc": "IN"
                }),
                contentType: 'application/json',
                success: function (Transaction) {
                    var msg = Transaction.result.toString();
                    if (msg != null) {
                        alert('转赠成功，交易哈希为：' + Transaction.result.toString());
                    }
                    else {
                        alert('转赠失败：' + Transaction.error.message.toString());
                    }
                },
                error: function (xhr, type) {
                    alert('err1');
                }
            })
        },
        error: function (xhr, type) {
            alert('err2');
        }
    })
});