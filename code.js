// =================================================================
// 1. KHAI BÁO CÁC PHẦN TỬ HTML CẦN CẬP NHẬT
// =================================================================

const pokemonDataElement = document.getElementById('pokemon-data');
const weatherDataContainer = document.getElementById('weather-data'); // Vị trí chứa thông báo tải/lỗi
const weatherIconElement = document.getElementById('weather-icon');
const weatherDetailsElement = document.getElementById('weather-details');
const pokemonName = document.getElementById('pokemon-name');
const exchangeRateDataElement = document.getElementById('exchange-rate-data');
const refreshExchangeButton = document.getElementById('refresh-exchange-btn');

document.addEventListener('DOMContentLoaded', () => {
    const pokemonInput = document.getElementById('pokemon-name');
    pokemonInput.addEventListener('change', () => {
        const name = pokemonInput.value.toLowerCase();
        fetchPokemon(name)
    });

});

// =================================================================
// 2. XỬ LÝ POKEAPI (PIKACHU)
// =================================================================

async function fetchPokemon(pokemonName) {
    const url = `https://pokeapi.co/api/v2/pokemon/${pokemonName}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        const data = await response.json();
        displayPokemon(data);
    } catch (error) {
        pokemonDataElement.innerHTML = `<p>Không có dữ liệu!</p>`;
    }
}

function displayPokemon(data) {
    const html = `
        <div style="display: flex; align-items: center;">
            <img src="${data.sprites.front_default}" alt="${data.name}" style="width: 80px; margin-right: 15px;">
            <div>
                <p><strong>Tên:</strong> ${data.name.toUpperCase()}</p>
                <p><strong>ID:</strong> #${data.id}</p>
                <p><strong>Nguyên tố:</strong> ${data.types[0].type.name.toUpperCase()}</p>
                <p><strong>Chỉ số:</strong></p>
                <ul>
                    <li>${data.stats[0].stat.name.toUpperCase()}: ${data.stats[0].base_stat}</li>
                    <li>${data.stats[1].stat.name.toUpperCase()}: ${data.stats[1].base_stat}</li>
                    <li>${data.stats[2].stat.name.toUpperCase()}: ${data.stats[2].base_stat}</li>
                </ul>
            </div>
        </div>
    `;
    pokemonDataElement.innerHTML = html;
}


// =================================================================
// 3. XỬ LÝ OPEN-METEO (THỜI TIẾT)
// =================================================================

/**
 * Ánh xạ mã thời tiết (WMO Code) thành mô tả và biểu tượng.
 * Nguồn mã: https://open-meteo.com/en/docs
 */
function getWeatherDescription(code) {
    let description;
    let icon;

    // Các trường hợp thời tiết phổ biến (biểu diễn các dạng khác nhau)
    if (code === 0) {
        description = 'Trời quang mây';
        icon = '☀️';
    } else if (code >= 1 && code <= 3) {
        description = 'Chủ yếu quang mây đến nhiều mây';
        icon = '🌤️';
    } else if (code >= 45 && code <= 48) {
        description = 'Sương mù/Khói bụi';
        icon = '🌫️';
    } else if (code >= 51 && code <= 55) {
        description = 'Mưa phùn (nhẹ đến dày)';
        icon = '🌧️';
    } else if (code >= 61 && code <= 65) {
        description = 'Mưa (nhẹ đến lớn)';
        icon = '☔';
    } else if (code >= 71 && code <= 75) {
        description = 'Tuyết (nhẹ đến dày)';
        icon = '❄️';
    } else if (code >= 95 && code <= 99) {
        description = 'Giông bão';
        icon = '⚡⛈️';
    } else {
        description = 'Thời tiết khác (Code: ' + code + ')';
        icon = '❓';
    }
    return { description, icon };
}

async function fetchWeather(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        const data = await response.json();
        displayWeather(data.current_weather, latitude, longitude);
    } catch (error) {
        weatherDataContainer.innerHTML = `<p style="color: red;">❌ Lỗi: Không thể tải dữ liệu thời tiết. (${error.message})</p>`;
    }
}

function displayWeather(currentWeather, lat, lon) {
    const { temperature, windspeed, weathercode } = currentWeather;
    const { description, icon } = getWeatherDescription(weathercode);

    weatherIconElement.innerHTML = icon;

    weatherDetailsElement.innerHTML = `
        <p><strong>Vị trí:</strong> Vĩ độ: ${lat.toFixed(2)} / Kinh độ: ${lon.toFixed(2)}</p>
        <p><strong>Tình trạng:</strong> ${description}</p>
        <p><strong>Nhiệt độ:</strong> ${temperature} °C</p>
        <p><strong>Tốc độ gió:</strong> ${windspeed} km/h</p>
    `;
    weatherDataContainer.innerHTML = ''; // Xóa thông báo tải
}

function getLocationAndFetchWeather() {
    weatherDataContainer.innerHTML = `<p>🌍 Đang tìm kiếm vị trí...</p>`;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                weatherDataContainer.innerHTML = `<p>📡 Đã tìm thấy vị trí. Đang tải dữ liệu...</p>`;
                fetchWeather(latitude, longitude);
            },
            (error) => {
                weatherDataContainer.innerHTML = `<p style="color: orange;">⚠️ Lỗi truy cập vị trí. Đang dùng vị trí mặc định (Hà Nội)...</p>`;
                // Sử dụng vị trí mặc định (Hà Nội) nếu người dùng từ chối hoặc có lỗi
                fetchWeather(21.0285, 105.8542);
            }
        );
    } else {
        weatherDataContainer.innerHTML = `<p style="color: red;">❌ Trình duyệt không hỗ trợ Geolocation. Đang dùng vị trí mặc định (Hà Nội)...</p>`;
        fetchWeather(21.0285, 105.8542);
    }
}

// =================================================================
// 4. XỬ LÝ EXCHANGE RATE API (USD/VND)
// =================================================================

async function fetchExchangeRate() {
    exchangeRateDataElement.innerHTML = `<p>🔄 Đang tải tỷ giá...</p>`;
    const url = 'https://v6.exchangerate-api.com/v6/50cae54a97545dfca07872f9/latest/USD';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        const data = await response.json();

        // Trích xuất tỷ giá VND
        const vndRate = data.conversion_rates.VND;

        if (vndRate) {
            exchangeRateDataElement.innerHTML = `
                <p style="font-size: 1.2em; text-align: center;">
                    <strong>1 USD</strong> = <strong>${vndRate.toFixed(0)} VND</strong>
                </p>
                <p style="font-size: 0.8em; text-align: center; color: #ccc;">
                    (Cập nhật: ${new Date(data.time_last_update_utc).toLocaleDateString()})
                </p>
            `;
        } else {
            throw new Error("Không tìm thấy tỷ giá VND.");
        }

    } catch (error) {
        exchangeRateDataElement.innerHTML = `<p>Không có dữ liệu!</p>`;
    }
}

// =================================================================
// 5. CHẠY KHI TRANG TẢI XONG
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    fetchPokemon();
    getLocationAndFetchWeather();
    fetchExchangeRate();
});

// TRONG FILE script.js HOẶC code.js

document.addEventListener('DOMContentLoaded', () => {

    const globalRefreshButton = document.getElementById('global-refresh-btn');

    if (globalRefreshButton) {
        globalRefreshButton.addEventListener('click', () => {
            // Lệnh quan trọng: Tải lại trang web
            location.reload();
        });
    }
});