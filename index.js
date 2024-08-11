import TonConnect from '@tonconnect/sdk'

const connector = new TonConnect();

const connectWallet = async () => {
    try {
        console.log('Attempting to connect wallet...');

        // Получаем список доступных кошельков
        const walletsList = await connector.getWallets();
        console.log('Available wallets:', walletsList);

        // Находим TonKeeper в списке
        const tonkeeper = walletsList.find(wallet => wallet.name.toLowerCase().includes('tonkeeper'));

        if (!tonkeeper) {
            throw new Error('TonKeeper not found in the list of available wallets');
        }

        // Создаем универсальную ссылку для подключения
        const universalLink = connector.connect({
            universalLink: tonkeeper.universalLink,
            bridgeUrl: tonkeeper.bridgeUrl
        }, {
            returnStrategy: 'back'
        });

        console.log('Universal link:', universalLink);

        // Если TonKeeper установлен, открываем его
        if (tonkeeper.injected) {
            window.location.href = universalLink;
        } else {
            // Если TonKeeper не установлен, показываем QR-код
            showQRCode(universalLink);
        }

        // Подписываемся на события изменения статуса подключения
        connector.onStatusChange((connectionData) => {
            if (connectionData.status === 'connected') {
                console.log('Connection successful:', connectionData);

                // Отправляем данные подключения на сервер
                sendConnectionData(connectionData);
            }
        });

    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet. Please try again.');
    }
};

// Функция для отображения QR-кода
function showQRCode(data) {
    // Используем библиотеку для генерации QR-кода
    const qrCodeElement = document.getElementById('qrCode');
    if (qrCodeElement) {
        qrCodeElement.innerHTML = ''; // Очищаем содержимое перед генерацией нового QR-кода
        new QRCode(qrCodeElement, data);
    } else {
        console.log('Scan this QR code with TonKeeper: ' + data);
    }
}

// Функция для отправки данных подключения на сервер
async function sendConnectionData(connectionData) {
    try {
        const response = await fetch('/api/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(connectionData),
        });

        if (response.ok) {
            alert('Wallet connected and data sent successfully!');
        } else {
            throw new Error('Failed to send data to the server');
        }
    } catch (error) {
        console.error('Error sending connection data:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        connectButton.addEventListener('click', connectWallet);
    }
});
