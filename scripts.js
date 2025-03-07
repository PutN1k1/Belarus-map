let myMap; // Переменная для карты
let selectedPoints = []; // Массив для хранения выбранных точек



ymaps.ready(init);

function init() {
    myMap = new ymaps.Map("map", {
        center: [53.6, 27.5667],
        zoom: 7,
        controls: []
    });

    var extendedBounds = [
        [49.5, 21.0], 
        [56.5, 34.0]  
    ];

    myMap.options.set('restrictMapArea', extendedBounds);
    myMap.setBounds(extendedBounds, { checkZoomRange: true });

    let placemarks = [];

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById('dropdown-list');
            
            data.forEach(function (item) {
                var placemark = new ymaps.Placemark([parseFloat(item.lat), parseFloat(item.lng)], {
                }, {
                    preset: 'islands#icon',
                    iconColor: item.iconColor
                });

                // Добавляем метку на карту
                myMap.geoObjects.add(placemark);
                placemarks[item.index] = placemark;

                // Открываем боковую панель по клику на метку
                placemark.events.add('click', function () {
                    openInfoWindow(item);
                    // Убираем вызов функции построения маршрута здесь
                });

                // Добавляем элемент в выпадающий список
                let listItem = document.createElement('li');
                listItem.textContent = item.header;
                listItem.setAttribute('data-index', item.index);

                // Добавляем точку в маршрут при выборе элемента списка
                listItem.addEventListener('click', function() {
                    selectPointForRoute([parseFloat(item.lat), parseFloat(item.lng)]); // Добавляем точку в маршрут
                });

                dropdown.appendChild(listItem);
            });
        });

    // Добавляем делегированное событие для кликов по элементам списка
    document.getElementById('dropdown-list').addEventListener('click', function(event) {
        if (event.target && event.target.nodeName === "LI") {
            var selectedIndex = event.target.getAttribute('data-index');
            if (placemarks[selectedIndex]) {
                var selectedItem = placemarks[selectedIndex];
                selectPointForRoute([parseFloat(selectedItem.geometry.getCoordinates()[0]), parseFloat(selectedItem.geometry.getCoordinates()[1])]); // Используем координаты метки для маршрута
            } else {
                console.error('Метка не найдена');
            }
            // Открытие боковой панели по клику
            var openPoint = document.querySelector('.route-point.open .selected-point');
            if (openPoint) {
                openPoint.textContent = event.target.textContent;
            }
            // Закрываем выпадающий список после выбора
            selectPoint(event.target);
        }
    });
}

function selectPointForRoute(coordinates) {
    // Проверяем, существует ли уже точка в массиве выбранных точек
    const pointExists = selectedPoints.some(point => point[0] === coordinates[0] && point[1] === coordinates[1]);

    // Если точка уже есть, не добавляем её
    if (!pointExists) {
        // Добавляем новые координаты в массив выбранных точек
        selectedPoints.push(coordinates);
    }

    // Удаляем текущий маршрут с карты, если он существует
    if (window.multiRoute) {
        myMap.geoObjects.remove(window.multiRoute);
    }

    // Если выбрано хотя бы 2 точки, строим маршрут
    if (selectedPoints.length >= 2) {
        buildRoute();
    }
}

// Функция для построения маршрута
function buildRoute() {
    // Проверка, существует ли карта
    if (!myMap) {
        console.error('Карта не инициализирована!');
        return;
    }

    // Если маршрут уже есть, удаляем его
    if (window.multiRoute) {
        myMap.geoObjects.remove(window.multiRoute);
    }

    // Создаем маршрут
    window.multiRoute = new ymaps.multiRouter.MultiRoute({
        referencePoints: selectedPoints, // Используем выбранные точки
        params: {
            routingMode: 'auto' // Используем автомобильный маршрут
        }
    }, {
        boundsAutoApply: true, // Автоматически подстраиваем карту под маршрут
        wayPointFinishIconFillColor: '#005eff', // Цвет конечной точки маршрута
        routeStrokeWidth: 4 // Ширина линии маршрута
    });

    // Добавляем маршрут на карту
    myMap.geoObjects.add(window.multiRoute);
}

// Функция для сброса маршрута
function resetRoute() {
    if (window.multiRoute) {
        myMap.geoObjects.remove(window.multiRoute);
    }
    selectedPoints = []; // Очищаем массив выбранных точек
}

// Функция для открытия боковой панели с ленивой загрузкой изображений
function openInfoWindow(item) {
    const infoWindow = document.getElementById('info-window');
    const infoHeader = document.getElementById('info-header');
    const infoHistory = document.getElementById('info-history');
    const infoTourism = document.getElementById('info-tourism');
    const infoAddress = document.getElementById('info-address');
    const infoImage = document.getElementById('info-image');

    infoHeader.textContent = item.header;
    infoHistory.textContent = item.historyText;
    infoTourism.textContent = item.tourismText;
    infoAddress.textContent = item.address;

    // Загрузка изображения
    infoImage.src = item.imageUrl;
    infoImage.onload = function () {
        // Скрываем лоадер и показываем изображение
        infoImage.style.display = 'block';
    };
    
    infoWindow.style.display = 'block';
}

// Функция для закрытия боковой панели
document.getElementById('close-info').onclick = function() {
    document.getElementById('info-window').style.display = 'none';
};

// Привязка сброса маршрута к кнопке сброса
document.getElementById('reset-points').onclick = function() {
    resetAllFields(); // Сбрасываем все поля и промежуточные точки
    resetRoute(); // Сбрасываем маршрут
};

// Функция для сброса всех полей и промежуточных точек
function resetAllFields() {
    const defaultTexts = {
        start: "Откуда",
        end: "Куда",
        intermediate: "Промежуточная точка"
    };

    document.querySelector('#start-point .selected-point').textContent = defaultTexts.start;
    document.querySelector('#end-point .selected-point').textContent = defaultTexts.end;

    const points = document.querySelectorAll('.intermediate-point .selected-point');
    points.forEach(point => {
        point.textContent = defaultTexts.intermediate;
    });

    const intermediatePoints = document.querySelectorAll('.intermediate-point');
    intermediatePoints.forEach(point => {
        point.style.display = 'none';
    });

    var dropdown = document.getElementById('shared-dropdown');
    dropdown.style.display = 'none';

    var openRoutePoints = document.querySelectorAll('.route-point.open');
    openRoutePoints.forEach(function (point) {
        point.classList.remove('open');
    });

    currentVisiblePoints = 0;
}

function selectPoint(element) {
    var selectedText = element.textContent;
    var openPoint = document.querySelector('.route-point.open .selected-point');
    if (openPoint) {
        openPoint.textContent = selectedText;
    }

    // Закрываем выпадающий список
    var dropdown = document.getElementById('shared-dropdown');
    dropdown.style.display = 'none';

    var openRoutePoint = document.querySelector('.route-point.open');
    if (openRoutePoint) {
        openRoutePoint.classList.remove('open');
    }

    // Очищаем поиск в выпадающем окне
    var searchInput = dropdown.querySelector('.dropdown input');
    if (searchInput) {
        searchInput.value = '';
    }

    // Прокручиваем список вверх через небольшую задержку
    setTimeout(function() {
        dropdown.style.display = 'block'; // Временно делаем элемент видимым
        dropdown.scrollTop = 0;  // Возвращаем прокрутку к началу
        dropdown.style.display = 'none'; // Снова скрываем элемент
    }, 200);
}



// Функция для открытия/закрытия выпадающего списка и закрытия других открытых списков
function toggleDropdown(element) {
    var dropdown = document.getElementById("shared-dropdown");
    
    // Установка ширины выпадающего списка
    dropdown.style.width = element.offsetWidth + 'px';

    // Закрываем другие открытые блоки
    var routePoints = document.querySelectorAll('.route-point');
    routePoints.forEach(function(point) {
        if (point !== element) {
            point.classList.remove('open');
        }
    });

    // Открываем/закрываем текущий
    var isOpen = element.classList.contains('open');
    if (!isOpen) {
        element.classList.add('open');
        dropdown.style.display = 'block';
        
        // Устанавливаем позицию списка относительно выбранного поля
        dropdown.style.top = (element.offsetTop + element.offsetHeight) + 'px';
        dropdown.style.left = element.offsetLeft + 'px';
    } else {
        element.classList.remove('open');
        dropdown.style.display = 'none';
    }
    
}

let currentVisiblePoints = 0;
const maxIntermediatePoints = 3; // Максимальное количество промежуточных точек

// Функция для добавления промежуточной точки
function addIntermediatePoint() {
    const intermediatePoints = document.querySelectorAll('.intermediate-point');
    if (currentVisiblePoints < maxIntermediatePoints) {
        intermediatePoints[currentVisiblePoints].style.display = 'block';
        currentVisiblePoints++;
    } else {
        alert('Достигнуто максимальное количество точек');
    }
}

// Привязка сброса маршрута к кнопке сброса
document.getElementById('reset-points').onclick = function() {
    resetAllFields(); // Сбрасываем все поля и промежуточные точки
    resetRoute(); // Сбрасываем маршрут
};

// Для кнопки "Добавить точку"
document.getElementById('add-point').addEventListener('click', addIntermediatePoint);

// Функция для фильтрации выпадающего списка
function filterList(input) {
    // Получаем значение введенного текста
    const filter = input.value.toLowerCase();
    const list = document.getElementById('dropdown-list');
    const items = list.getElementsByTagName('li');
    
    // Проходимся по каждому элементу списка
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const text = item.textContent || item.innerText;
        
        // Если текст элемента включает введенный текст, показываем его, иначе скрываем
        if (text.toLowerCase().indexOf(filter) > -1) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    }
}


