/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1Ijoia2VsbHlrZWxseTciLCJhIjoiY202aWNjdDE5MDcwbTJrcHppYWw5ZjJzcCJ9.pry2p-gu8qXteiF0TWa4dw'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// map initialization 
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/kellykelly7/cm7y9wzv600vw01saejijeyfm',  // ****ADD MAP STYLE HERE *****
    center: [-79.359633, 43.727740],  // starting point, longitude/latitude
    zoom: 10.5 // starting zoom level
});

//adding zoom and rotation controls to map
map.addControl(new mapboxgl.NavigationControl());

/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable
let collisiongeojson;

// initially disabling button so that it is only enabled after data is fetched
document.getElementById('bboxbutton').disabled = true;

// Fetch GeoJSON from URL and store response
fetch('https://raw.githubusercontent.com/kellykelly7/ggr472-lab4-main/refs/heads/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response); //Check response in console
        collisiongeojson = response; // Store geojson as variable using URL from fetch response

        // Enable bboxbutton after data is fetched
        document.getElementById('bboxbutton').disabled = false;
});

// adding collisiongeojson to map after fetching it
map.on('load', () => {
    map.addSource('collision_data', {
        type: 'geojson',
        data: collisiongeojson
    })
    map.addLayer({
        // item id
        'id': 'coll_data',
        // type of style 
        'type': 'circle',
        // original data source
        'source': 'collision_data', 
        //changes the characteristics of the element
        'layout': {},
        //changes the appearance of the element
        'paint': {
            //color of the circle
            'circle-color': '#d000ff',
            //size of the circle
            'circle-radius': 3
        }
    });
});

/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function
//      **Option: You may want to consider how to increase the size of your bbox to enable greater geog coverage of your hexgrid
//                Consider return types from different turf functions and required argument types carefully here

let bbox;

document.getElementById('bboxbutton').addEventListener('click', () => {

    bbox = turf.bbox(collisiongeojson);

    console.log(bbox);

    let bboxPoly = turf.bboxPolygon(bbox);

    let sizedbboxp = turf.transformScale(bboxPoly, 1.15);

    let sizedbbox = turf.bbox(sizedbboxp);

    map.addSource('envdata', {
        'type': 'geojson',
        'data': sizedbboxp
    });

    map.addLayer({ 
        'id': 'envelope',
        'type': 'fill',
        'source': 'envdata',
        "paint": {
            'fill-color': "#f7d600",
            'fill-opacity': 0.5,
            'fill-outline-color': "black"
        }
    });

    const options = {units: 'kilometers'};
    const cellSide = 0.5;

    const hexgrid = turf.hexGrid(sizedbbox, cellSide, options);

        map.addSource('hexgrid', {
            'type': 'geojson',
            'data': hexgrid
        });
        map.addLayer({
            'id': 'hexagrid-fill',
            'type': 'fill',
            'source': 'hexgrid',
            'paint': {
                'fill-color': '#F4E3F6',
                'fill-opacity': 0.8 
            },
        });
        map.addLayer({
            'id': 'hexagrid-border',
            'type': 'line',
            'source': 'hexgrid',
            'paint': {
                'line-color': 'black',
                'line-width': 0.25
                }
            });
    // disable button after click
    document.getElementById('bboxbutton').disabled = true;

    let collishex = turf.collect(hexgrid, collisiongeojson, '_id', 'collisions');

    let maxcollision = 0;

    collishex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length;   
        if (feature.properties.COUNT > maxcollision) {
            maxcollis = feature.properties.COUNT
        }
    });
    console.log(maxcollision);
});


/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty



// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows

const legendlabels = [];
const legendcolors = [];
 const legend = document.getElementById('legend');

 //For each layer create a block to put the colour and label in
legendlabels.forEach((label, i) => {
    const colour = legendcolours[i];

    const item = document.createElement('div'); //each layer gets a 'row'
    const key = document.createElement('span'); //add a 'key' to the row 

    key.className = 'legend-key'; //the key takes on the shape and style properties defined in css
    key.style.backgroundColor = colour; // the background color is retreived from the layers array

    const value = document.createElement('span'); //add a value variable to the 'row' in the legend
    value.innerHTML = `${label}`; //give the value variable text based on the label

    item.appendChild(key); //add the key (colour circle) to the legend row
    item.appendChild(value); //add the value to the legend row

    legend.appendChild(item); //add row to the legend
});

map.addSource('collishexgrid', {
    type: 'geojson',
    data: collishex,
})
map.addLayer({
    id: 'collishexfill', 
    type: 'fill', 
    source: 'collishexgrid',
    paint:{
        'fill-color': [
            'step',
            ['get', 'COUNT'], 
            '#ffffff', 
            10, '#ffebf1', 
            25, '#ffa0a6',
            maxcollision, '#ff0000'
        ],
        'fill-opacity': 0.8
    },
    filter: ['!=', 'COUNT', 0],
});

map.on('click', 'collishexfill', (e) => {
    new mapboxgl.Popup() //Declare new popup object on each click
        .setLngLat(e.lngLat) //Use method to set coordinates of popup based on mouse click location
        //Use click event properties to write text for popup
        .setHTML("<b>Collision count: </b>" + e.features[0].properties.COUNT)
        .addTo(map); //Show popup on map
});
