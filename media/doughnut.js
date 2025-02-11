const ctx = document.getElementById('binarySizeChart').getContext('2d');
const totalSize = 256 * 1024;
const bootloaderSize = 0;
const sectionSize = 0;
const remainingSize = totalSize - 0;
const binarySizeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['.bss', '.code', '.data', 'free', 'boot'],
        datasets: [{
            label: 'Binary Size Distribution',
            data: [sectionSize, sectionSize, sectionSize, remainingSize, bootloaderSize],
            backgroundColor: [
                'rgba(61, 127, 242, 0.2)',
                'rgba(151, 61, 242, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(61, 242, 91, 0.2)',
                'rgba(255, 99, 132, 0.2)'
            ],
            borderColor: [
                'rgba(61, 127, 242, 1)',
                'rgba(151, 61, 242, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(61, 242, 91, 1)',
                'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        animation: {
            animateRotate: true,
        },
        scales: {
            y: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        },
        plugins: {
            legend: {
                labels: {
                    font: {
                        weight: 'bold'
                    },
                    color: 'white',
                    align: 'start'
                }
            },
            title: {
                display: true,
                text: 'Binary size',
                font: {
                    size: 24
                },
                color: 'white'
            }
        }
    }
});

function updateDoughnutChart(chartData) {
    binarySizeChart.data = chartData;
    binarySizeChart.update();

}

function updateChart(binarySize, chipset) {
    const totalSize = 256 * 1024;
    const bootloaderSize = 4 * 1024;
    const textSize = binarySize.text || 0;
    const dataSize = binarySize.data || 0;
    const bssSize = binarySize.bss || 0;
    const builtImageSize = textSize + dataSize + bssSize + bootloaderSize;
    const available = totalSize - builtImageSize;

    const formattedData = {
        labels: [
            `.text ${(textSize/1024).toFixed(1)} KB, ${((textSize / totalSize) * 100).toFixed(2)}%`,
            `.data ${(dataSize/1024).toFixed(1)} KB, ${((dataSize / totalSize) * 100).toFixed(2)}%`,
            `.bss ${(dataSize/1024).toFixed(1)} KB, ${((bssSize / totalSize) * 100).toFixed(2)}%`,
            `free ${(available/1024).toFixed(1)} KB, ${((available / totalSize) * 100).toFixed(2)}%`,
            `boot ${(bootloaderSize/1024).toFixed(1)} KB, ${((bootloaderSize / totalSize) * 100).toFixed(2)}%`
        ],
        datasets: [{
            label: 'Binary Size Distribution',
            data: [textSize, dataSize, bssSize, available, bootloaderSize],
            backgroundColor: [
                'rgba(61, 127, 242, 0.2)',
                'rgba(151, 61, 242, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(61, 242, 91, 0.2)',
                'rgba(255, 99, 132, 0.2)'
            ],
            borderColor: [
                'rgba(61, 127, 242, 1)',
                'rgba(151, 61, 242, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(61, 242, 91, 1)',
                'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
        }]
    };

    const chartContainer = document.getElementById('binarySizeChart');
    if (chartContainer) {
        if (typeof updateDoughnutChart === 'function') {
            updateDoughnutChart(formattedData);
        } else {
            const script = document.createElement('script');
            script.src = 'doughnut.js';
            script.onload = () => {
                updateDoughnutChart(formattedData);
            };
            document.head.appendChild(script);
        }
    }

    // Handle the error message for size overflow
    let expectedSize;
    if (chipset === 'FT90x'){
        expectedSize = 256 * 1024 - bootloaderSize;
    } else if (chipset === 'FT93x'){
        expectedSize = 128 * 1024 - bootloaderSize;
    } else {
        expectedSize = 0;
    }
    if (expectedSize && builtImageSize > expectedSize) {
        document.getElementById('error-message').style.display = 'block';
    } else {
        document.getElementById('error-message').style.display = 'none';
    }
}
