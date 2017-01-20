
VodafoneTVApp.config(['$sceDelegateProvider', function($sceDelegateProvider) {
  // We must whitelist the JSONP endpoint that we are using to show that we trust it
  $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    'http://*/**'
  ]);
}]);
VodafoneTVApp.factory('serviceData', function($http, $q, $sce){
    
    //LOCAL
    //var hostServer = 'http://localhost';
    //var watsonServer = hostServer + ':3000';

    //PROD
    var hostServer = 'https://cognitivevodatv.mybluemix.net';
    var watsonServer = hostServer;

    //var hostServer = '10.0.2.2';
    var _getHostServer = function(){
        return hostServer;
    }

    var _getWasonServer = function() {
        return watsonServer;
    }

    var _navigationLayers = {
        default : "defaultLayer",
        main : "mainLayer",
        list : "seasonListLayer",
        chapterList : "chapterListLayer",
        content : "contentLayer",
        player : "playLayer"
    }

    var _getNavigationLayers = function () {
        return _navigationLayers;
    }

    var _currentLayer;

    var _updateCurrentLayer = function(layer) {
        _currentLayer = layer;
    }

    var _getCurrentLayer = function () {
        return _currentLayer;
    }

    var _callService = function (typeContent, filterList){

        console.log("_callService :: " + typeContent);
        if (typeContent !== undefined && typeContent !== ""){
            typeContent = typeContent.trim().toLowerCase();

            // AÑADIMOS EL DEFER PARA EL SERVICIO ASINCRONO
            var deferred = $q.defer();
            
            
            //$sce.trustAsResourceUrl(url);
            $http.get(hostServer+'/MyVodafoneTV/controller/mock_servicios/'+ typeContent +'.json')
            //$http.jsonp(url, {jsonpCallbackParam: 'callback'})
            .then(
                //function success(response) {
                function successCallback(response) {
                                        
                    //console.log("_callService jsonResponse :: ", angular.toJson(response.data) );
                    // RECIBIMOS EL JSON CON EL CONTENIDO (SIEMPRE SERA O .assets[] O .medias[])
                    var contentList;
                    var responseList = [];
                    if (response.data.assets !== undefined){
                        contentList = response.data.assets;
                    }else if (response.data.medias !== undefined){
                        contentList = response.data.medias;
                    }
                                        
                    angular.forEach(contentList, function(contentItem, i){
                        /*console.log(contentItem.id);
                        console.log(contentItem.title); 
                        console.log(contentItem.description);                      
                        console.log(contentItem.pictures.poster);*/
                        var item = {
                            id: contentItem.id,
                            title: contentItem.title,
                            description: contentItem.description,
                            //url: (typeContent === "cine") ? contentItem.pictures.player : contentItem.pictures.poster
                            url: contentItem.pictures.poster,
                            urldetail : (typeContent === "cine") ? contentItem.pictures.player : contentItem.pictures.banner
                            
                        };

                        if (filterList === false){
                            responseList[i] = item;
                        } else if (filterList.indexOf(contentItem.id)!==-1){
                            responseList[filterList.indexOf(contentItem.id)] = item;
                        }


                        
                        
                    });
                    console.log("_callService service response :: ", responseList );

                    //ENLAZAMOS LA RESPUESTA AL DEFER UNA VEZ QUE LA TENEMOS
                    deferred.resolve(responseList);
                },
                function errorCallback(response) {
                    console.log("Se ha producido un error al procesar la llamada", response);
                    deferred.reject("Se ha producido un error al procesar la llamada" + response);
                }
            );
            //DEVOLVEMOS LA RESPUESTA UNA VEZ HA SIDO COMPLETADA;
            //return deferred.promise;
            return $q.when(deferred.promise);
        }
    };

    var _getContentList = function (itemId, seasonId, typeContent) {
        console.log("Obteniendo el item [" + itemId + "] para la temporada ["+seasonId+"] y tipo [" + typeContent + "]");
        if (typeContent !== undefined && typeContent !== ""){
            typeContent = typeContent.trim().toLowerCase();
            var deferred = $q.defer();

            //var path = typeContent + '/'+ itemId + '/'+ seasonId +'/episodes.json';
            
            $http.get(hostServer+'/MyVodafoneTV/controller/mock_servicios/'+ typeContent + '/'+ itemId + '/'+ seasonId +'/episodes.json')
            //$http.jsonp(url)
            .then(
                function successCallback(response) {
                    //console.log(response);
                    var itemList = [];
                    angular.forEach(response.data.assets, function(episodeItem, i){
                        $http.get(hostServer+'/MyVodafoneTV/controller/mock_servicios/'+ typeContent + '/'+ itemId + '/'+ seasonId +'/'+ episodeItem.id +'.json')
                        .then(
                            function successCallback(response) {
                                var elemento = response.data.medias[0];
                                var item = {
                                    id: elemento.id,
                                    title: elemento.title,
                                    description: elemento.description,
                                    episode_number: episodeItem.episode_number,
                                    season: seasonId,
                                    url: {
                                        img : {
                                            banner : elemento.series.pictures.banner,
                                            poster : elemento.series.pictures.poster
                                        },
                                        player : {
                                            player : elemento.pictures.player,
                                            poster : elemento.pictures.poster
                                        }
                                    },
                                    urlplay:{
                                        sd : elemento.files.sd.url,
                                        //hd : elemento.files.hd.url
                                    }


                                }
                                itemList[i] = item;
                                console.log("ELEMENTO EXTRAIDO :: ", item);
                            },
                            function errorCallback(response) {
                                console.log("Se ha producido un error al procesar la llamada", response);
                                deferred.reject("Se ha producido un error al procesar la llamada" + response);
                            }
                        );    
                    });
                    deferred.resolve(itemList);
                },
                function errorCallback(response) {
                    console.log("Se ha producido un error al procesar la llamada", response);
                    //deferred.reject("Se ha producido un error al procesar la llamada" + response);
                }
            );
            return $q.when(deferred.promise);
        }
    }

    var _getSeasonList = function (itemId, typeContent) {
        console.log("Obteniendo el item [" + itemId + "] para el tipo ["+typeContent+"]");
        if (typeContent !== undefined && typeContent !== ""){
            typeContent = typeContent.trim().toLowerCase();

            var deferred = $q.defer();
            $http.get(hostServer+'/MyVodafoneTV/controller/mock_servicios/'+ typeContent + '/'+ itemId + '/'+ itemId +'.json')
            .then(
                function successCallback(response) {
                    console.log(response);
                    var seasonData = {
                        total_seasons : response.data.medias[0].total_seasons,
                        seasons : response.data.medias[0].seasons
                    }
                    deferred.resolve(seasonData);
                },
                function errorCallback(response) {
                    console.log("Se ha producido un error al procesar la llamada", response);
                    deferred.reject("Se ha producido un error al procesar la llamada" + response);
                }
            );
            //DEVOLVEMOS LA RESPUESTA UNA VEZ HA SIDO COMPLETADA;
            //return deferred.promise;
            return $q.when(deferred.promise);
        }
    }

    var initialList = ["inf1","adu1","ser1","juv1"];
    var categoriaList = ["cine", "infantil", "series"];

    //var _translateWatsonList = function (typeContent, filterPreview, filterParams){
    var _translateWatsonList = function (filterParams){
        console.log("######################################################################");
        console.log("###########  TRADUCIENDO ELEMENTOS CON FILTRO :: ", filterParams, " ##");
        console.log("#######################################################################");
        var deferred = $q.defer();
        $http.get(hostServer+'/MyVodafoneTV/controller/mock_servicios/content.json')
        .then(
            function successCallback(response) {
                console.log("Response from http://localhost/MyVodafoneTV/controller/mock_servicios/content.json", response.data);
                var translatedList = [];

                var firstType = (filterParams.contenido_previsualizar[0]!==undefined) ? filterParams.contenido_previsualizar[0].substring(0,3) : "";   
                /*if (initialList.indexOf(firstType)===-1 && filterParams.filterVideo !== ""){
                    console.log("Vamos a tratar un video");
                    _updateCurrentLayer(_navigationLayers.player);
                } else if (initialList.indexOf(firstType)===-1 && filterParams.filterChapter !== "" && filterParams.filterSeason !== ""){
                    console.log("FILTRANDO POR UN CAPITULO");
                    _updateCurrentLayer(_navigationLayers.content);  
                } else if (initialList.indexOf(firstType)===-1 && filterParams.filterChapter === "" && filterParams.filterSeason !== "") {
                    console.log("FILTRANDO POR UNA TEMPORADA");
                    _updateCurrentLayer(_navigationLayers.chapterListLayer);  
                } else if (initialList.indexOf(firstType)===-1 && (filterParams.filterName !== "" || filterParams.filterId !== "")){
                    console.log("FILTRANDO POR UN ITEM (SERIE, PELICULA, ...) ", filterParams.filterName, response.data[typeContent], filterParams.filterId);
                    angular.forEach(response.data[typeContent], function(item, i){
                        console.log(item, item.name, i);
                        if (i === filterParams.filterId){
                            translatedList[0] = item.id;
                            console.log("ENCONTRADO EL ELEMENTO ... ", translatedList[0]);
                        }
                    });
                    _updateCurrentLayer(_navigationLayers.list);                    
                }else{                     

                    console.log("FILTRANDO POR LISTADO ... ");
                    if (typeContent !== undefined){
                        angular.forEach(filterPreview, function(item, i){                    
                            console.log(item, i);
                            translatedList[i] = response.data[typeContent][item].id;                        
                        });
                    }else{
                        translatedList = [];
                    }
                    _updateCurrentLayer(_navigationLayers.main);
                }*/

                console.log("COMPARE ARRAYS",initialList, filterParams.contenido_previsualizar);
                if (angular.equals(initialList, filterParams.contenido_previsualizar)){
                    console.log("contenido inicial");
                    _updateCurrentLayer(_navigationLayers.default);
                }else if (filterParams.contenido_previsualizar.length > 0 && categoriaList.indexOf[filterParams.categoria] !== -1 
                    && filterParams.filterName === "" 
                    && filterParams.filterId ===""
                    && filterParams.filterSeason ===""){
                    console.log("FILTRO :: FILTRANDO POR LISTADO ... ");
                     if (filterParams.categoria !== undefined){
                        angular.forEach(filterParams.contenido_previsualizar, function(item, i){                    
                            console.log(item, i);
                            translatedList[i] = response.data[filterParams.categoria][item].id;                        
                        });
                    }else{
                        translatedList = [];
                    }   
                    _updateCurrentLayer(_navigationLayers.main);
                } else if (filterParams.contenido_previsualizar.length > 0 && filterParams.filterName !== "" && filterParams.filterId !== "") {
                     console.log("FILTRO :: FILTRANDO POR UN ITEM (SERIE, PELICULA, ...) ", filterParams.filterName, filterParams.categoria, filterParams.filterId);
                      angular.forEach(response.data[filterParams.categoria], function(item, i){
                        console.log(item, item.name, i);
                        if (i === filterParams.filterId){
                            translatedList[0] = item.id;
                            console.log("ENCONTRADO EL ELEMENTO ... ", translatedList[0]);
                        }
                    });
                    _updateCurrentLayer(_navigationLayers.list);              
                } else if (filterParams.contenido_previsualizar.length > 1 
                    && filterParams.filterName === "" 
                    && filterParams.filterId === ""
                    && filterParams.filterSeason !== ""
                    && filterParams.filterChapter === "") {
                    console.log("FILTRO :: FILTRANDO ENTRE TEMPORADAS ", filterParams.filterSeason);
                    _updateCurrentLayer(_navigationLayers.chapterList);
                } else if ( filterParams.filterChapter !== "" && filterParams.filterSeason !== ""){
                     console.log("FILTRO :: DETALLE UN CAPITULO");
                    _updateCurrentLayer(_navigationLayers.content); 
                } else if ( filterParams.filterVideo !== "") {
                    console.log("FILTRO :: TRATANDO VIDEO ...");
                    _updateCurrentLayer(_navigationLayers.player);
                }

                console.log("ELEMENTOS TRADUCIDOS :: ", translatedList);
                deferred.resolve(translatedList);
            },
            function errorCallback(response) {
                console.log("Se ha producido un error al procesar la llamada", response);
                deferred.reject("Se ha producido un error al procesar la llamada" + response);
            }            
        );
        return $q.when(deferred.promise);        
    }
    

    return {    
        callService : _callService,
        getSeasonList: _getSeasonList,
        getContentList : _getContentList,
        translateWatsonList : _translateWatsonList,
        getHostServer : _getHostServer,
        getWasonServer: _getWasonServer,
        updateCurrentLayer : _updateCurrentLayer,
        getCurrentLayer : _getCurrentLayer,
        getNavigationLayers : _getNavigationLayers

    }

});