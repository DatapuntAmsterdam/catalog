(function() {
  // Create the connector object
  var myConnector = tableau.makeConnector();

  // Define the schema
  myConnector.getSchema = function(schemaCallback) {
    // Schema for magnitude and place data
    var container_cols = [{
      id: "id",
      dataType: tableau.dataTypeEnum.string
    },{
      id: "id_number",
      alias: "id number",
      dataType: tableau.dataTypeEnum.string
    },{
      id: "waste_name",
      alias: "fractie",
      dataType: tableau.dataTypeEnum.string
    },{
      id: "buurt_code",
      alias: "buurt_code",
      dataType: tableau.dataTypeEnum.string
    },{
      id: "active",
      alias: "is active",
      dataType: tableau.dataTypeEnum.bool
    },{
      id: "address",
      alias: "address",
      dataType: tableau.dataTypeEnum.string
    }, {
      id: "lat",
      alias: "latitude",
      dataType: tableau.dataTypeEnum.float
    }, {
      id: "lon",
      alias: "longitude",
      dataType: tableau.dataTypeEnum.float
    }, {
      id: "volume",
      alias: "volume m3",
      dataType: tableau.dataTypeEnum.float
    }, {
      id: "site",
      alias: "site",
      dataType: tableau.dataTypeEnum.string
    }, {
      id: "placing_date",
      alias: "placing date",
      dataType: tableau.dataTypeEnum.date
    }];

    var containerTable = {
      id: "container",
      alias: "Container Data",
      columns: container_cols
      //endpoint: "containers"
    };

    // Schema for time and URL data
    // var time_url_cols = [{
    //   id: "id",
    //   dataType: tableau.dataTypeEnum.string
    // }, {
    //   id: "time",
    //   alias: "time",
    //   dataType: tableau.dataTypeEnum.date
    // }, {
    //   id: "url",
    //   alias: "url",
    //   dataType: tableau.dataTypeEnum.string
    // }];

    //var timeUrlTable = {
    //    id: "timeUrl",
    //    alias: "Time and URL Data",
    //    columns: time_url_cols
    //};

    schemaCallback([
      containerTable,
      //timeUrlTable
    ]);
  };

  // Download the data
  myConnector.getData = function(table, doneCallback) {
  // var dateObj = JSON.parse(tableau.connectionData),
  // dateString = "starttime=" + dateObj.startDate + "&endtime=" + dateObj.endDate,

    var apiCall = "https://api.data.amsterdam.nl/afval/v1/containers/";  // + dateString + "";
    // var apiCall = "http://localhost:8889/localhost:8000/afval/v1/containers/";  // + dateString + "";

    var params = {
      "format": "json",
      "detailed": 1,
      "page_size": 1000,
      "page": 1,
    };

    //var hasresults = [];
    var feat = [];
    var promises = [];
    var totalcount = 0;

    function getPage(page) {

      params.page = page;

      promises.push($.getJSON(apiCall, params, function(resp) {

        totalcount = resp.count;
        feat = resp.results;

        var tableData = [];
        var i = 0;
        var row = [];
        var len = 0;

        if( feat === undefined || feat.length === 0 ){
          return;
        } else {
          if (table.tableInfo.id == "container") {
            for (i = 0, len = feat.length; i < len; i++) {
              row = {
                "id": feat[i].id,
                "id_number": feat[i].id_number,
                "address": feat[i].address,
                "waste_name": feat[i].waste_name,
                "active": feat[i].active,
                "volume": feat[i].container_type.volume || 0,
                "placing_date": feat[i].placing_date
              };

              if(feat[i].well !== null) {
                row.lon = feat[i].well.geometrie.coordinates[0];
                row.lat = feat[i].well.geometrie.coordinates[1];
                row.buurt_code = feat[i].well.buurt_code;
                row.site = feat[i].well.site;
              }
              if(row.placing_date !== null) {
                row.placing_date = row.placing_date.toString().slice(0, 10);
              }
              tableData.push(row);
            }
          }
          table.appendRows(tableData);
        }
      }));
    }

    function loadAPI(totalpages){
      var page = 2;
      while (page <= totalpages){
        // get the next page.
        getPage(page);
        page += 1;
      }
    }

    function slurpAPI(){
      // load the fist page
      getPage(1);
      $.when.apply($, promises).then(function(){
        loadAPI(Math.ceil(totalcount / params.page_size));
      });
    }

    slurpAPI();

    $.when.apply($, promises).then(function(){
      doneCallback();
    });
  };

  tableau.registerConnector(myConnector);

  // Create event listeners for when the user submits the form
  $(document).ready(function() {
    $("#submitButton").click(function() {
      tableau.connectionName = "Containers"; // This will be the data source name in Tableau
      tableau.submit(); // This sends the connector object to Tableau
    });
  });
})();
