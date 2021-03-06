# Генератор сценариев дня для Open House

**Пример JSON сценария 13-го дня, сгенерированного этой тулзой:**

https://github.com/shurf771/OpenHouse_ScenarioBuilder/blob/master/sample/scenarios_ep13.json

## Бинарник для osx64
если не хочется качать nodejs, nwjs и сорсы, есть вот:
https://drive.google.com/file/d/1MlBBQcsJeAvXAaCryJiK0lz-p8C65ey5/view?usp=sharing

## Установка

1. скачать и установить nodejs https://nodejs.org/en/download/ , скорей всего он уже есть, проверить можно так:
```sh
$ node -v
```

2. скачать и установить nwjs https://nwjs.io/downloads/
лучше качать **sdk** версию (чтобы были _инструменты разработчика_, в обычной версии этого нет).
для мака путь к исполняемому файлу должен быть примерно такой:
```/Applications/nwjs-sdk-v0.49.2-osx-x64/nwjs.app/Contents/MacOS/nwjs```
если получился другой, то в ```/OpenHouse_ScenarioBuilder/src/package.json``` в поле **scripts.devmac** надо вписать свой.
С виндой проще, nwjs прописывается в PATH (если нет, сделать самому), и из любого места вызывается простым nw.

3. и наконец склонировать репу
```sh
$ git clone https://github.com/shurf771/OpenHouse_ScenarioBuilder.git
$ cd OpenHouse_ScenarioBuilder
$ ./setup.sh #необязательно, только если есть намерение билдить бинарник
```

## Запуск
```sh
$ ./run.sh
```

на Windows соответственно
```sh
$ ./run.win.sh
```

## Описание

### Шаг1.
![Image of Yaktocat](http://shurf771.com/images/oh_scenario_generator/s1.jpg)

В начале будет предложено ввести актуальные ссылки на скачивание XLSX гугл-табличек **m3:localization** и **m3:quests**, но скорей всего там уже введены правильные пути, вряд ли они поменяются.

если свежие таблицы недавно скачаны, можно не перекачивать, а загрузить XLSX из кэша, иначе нажимаем кнопку **Загрузить (без кэша)**.

### Шаг2. 
![Image of Yaktocat](http://shurf771.com/images/oh_scenario_generator/s2.jpg)

Выбираем нужный нам день, тулза парсит скачанную ранее таблицу квестов, генерирует скелет дня -- JSON квестов и сценок после квестов, "маст-а" и прочее; вставляет туда стандартный набор экшенов, а также экшены баблов и комиксов на основании таблицы локализации.

### Шаг3.
![Image of Yaktocat](http://shurf771.com/images/oh_scenario_generator/s3.jpg)

На этом этапе в целом уже готов JSON дня, его можно сохранить в файл или скопировать в буфер соответсвующими кнопками вверху.

Предварительно можно настроить некоторые нюансы в табличке **"Общие настройки"**, в частности:
* где будет расположена камера. координаты будут использованые в начале каждого квеста для экшена **move_camera_fast**
* где будут находится по дефолту основные персонажи. эти координаты тоже будут прописаны в **set_position** в каждом квесте для активных персонажей ("активными" условно считаются те, у которых в этом квесте есть реплики в m3:localization)

понятно, что потом всё это будет правиться в ручном режиме, но удобнее когда камера и персонажи находятся в зоне текущего дня, а не на другом конце карты.

Также в настройках есть: 
* возможность включить/выключить а также выбрать дефолтную анимацию персонажа для баблов
* тоже самое для комиксов - анимации персонажей "через talk"
* и может что-то еще будет добавляться по мере необходимости
