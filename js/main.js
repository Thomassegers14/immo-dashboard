/* global d3, maplibregl */

// Formatting numbers
d3.formatDefaultLocale({
  decimal: ',',
  thousands: '.',
  grouping: [3],
  currency: ['', '€']
})

var size = 70;

// Add X axis
const x = d3.scaleSqrt()

// Add Y axis
const y = d3.scaleLinear()

Promise.all([
  d3.json('data/test.geojson', d3.autoType),
  d3.csv("data/data.csv", d3.autoType)
])
  .then(([graphData, scatterData]) => {
    x.domain(d3.extent(scatterData, d => d.landSurface)).nice()
    y.domain(d3.extent(scatterData, d => d.price)).nice()

    // plot all data
    makeScatterplot(scatterData)

    // plot data by municipality
    makeSmallMultiples('Herentals', scatterData.filter((d) => d.gemeente === 'Herentals'))
    makeSmallMultiples('Grobbendonk', scatterData.filter((d) => d.gemeente === 'Grobbendonk'))
    makeSmallMultiples('Olen', scatterData.filter((d) => d.gemeente === 'Olen'))
    makeSmallMultiples('Herenthout', scatterData.filter((d) => d.gemeente === 'Herenthout'))
    makeSmallMultiples('Zandhoven', scatterData.filter((d) => d.gemeente === 'Zandhoven'))
    makeSmallMultiples('Vorselaar', scatterData.filter((d) => d.gemeente === 'Vorselaar'))
    makeSmallMultiples('Lichtaart', scatterData.filter((d) => d.gemeente === 'Lichtaart'))
    makeSmallMultiples('Lille', scatterData.filter((d) => d.gemeente === 'Lille'))
    makeMap(graphData)
  })

function makeScatterplot(data) {
  const $graphWrapper = d3.select('.scatterplot')

  // Set outer dimensions
  const {
    width,
    height
  } = $graphWrapper.node().getBoundingClientRect()

  const margins = {
    top: 48,
    right: 24,
    bottom: 48,
    left: 42
  }

  // Set inner dimensions
  const innerWidth = width - margins.left - margins.right
  const innerHeight = height - margins.top - margins.bottom

  const svg = $graphWrapper
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margins.left}, ${margins.top})`)

  x.range([0, innerWidth])
  y.range([innerHeight, 0])

  const r = d3.scaleLinear()
    .domain([1, 800])
    .range([2, 6])

  svg.append('rect')
    .attr("class", "annotation annotation__area")
    .attr('x', 0)
    .attr('y', y(400000))
    .attr('width', innerWidth)
    .attr("height", (d) => {
      return y(100000) - y(400000);
    })

  svg.append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .attr('class', 'axis axis__x')
    .call(
      d3.axisBottom(x)
      .tickSize(-innerHeight)
      .tickPadding(12)
    );

  svg.append("g")
    .attr('class', 'axis axis__y')
    .call(
      d3.axisLeft(y)
      .tickSize(-innerWidth)
      .tickPadding(12)
      .tickFormat(d3.format(".0s"))
    );

  svg.append('text')
    .attr("class", "annotation")
    .attr('x', innerWidth / 2)
    .attr('y', y(250000))
    .html("Betaalbare huizen")

  // Add dots
  svg.append('g')
    .selectAll("dot")
    .data(data)
    .join("circle")
    .attr("class", "dot")
    .attr("cx", (d) => {
      return x(d.landSurface);
    })
    .attr("cy", (d) => {
      return y(d.price);
    })
    .attr("r", (d) => {
      return r(d.netHabitableSurface)
    })
    .on('mouseover', (e, d) => showTooltip(d))
    .on('mouseout', () => hideTooltip())
    .on("click",function(e, d){ window.open(d.url, '_blank') });
}

function makeSmallMultiples(level, data) {
  // Set the dimensions and margins of the graph
  const margins = {
    top: 48,
    right: 12,
    bottom: 24,
    left: 36
  }

  const $graphWrapper = d3.select(`.smallMultiple[data-level="${level}"]`)

  // Set outer dimensions
  const {
    width,
    height
  } = $graphWrapper.node().getBoundingClientRect()

  // Set inner dimensions
  const innerWidth = width - margins.left - margins.right
  const innerHeight = height - margins.top - margins.bottom

  const svg = $graphWrapper
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margins.left}, ${margins.top})`)

  x.range([0, innerWidth])
  y.range([innerHeight, 0])

  svg.append('rect')
    .attr("class", "annotation annotation__area")
    .attr('x', 0)
    .attr('y', y(400000))
    .attr('width', innerWidth)
    .attr("height", (d) => {
      return y(100000) - y(400000);
    })

  svg.append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .attr('class', 'axis axis__x')
    .call(
      d3.axisBottom(x)
      .ticks(3)
      .tickSize(-innerHeight)
      .tickPadding(12)
    );

  svg.append("g")
    .attr('class', 'axis axis__y')
    .call(
      d3.axisLeft(y)
      .tickValues([0, 400000, 800000])
      .tickSize(-innerWidth)
      .tickPadding(6)
      .tickFormat(d3.format(".0s"))
    );

  // Add dots
  svg.append('g')
    .selectAll("dot")
    .data(data)
    .join("circle")
    .attr("class", "dot")
    .attr("cx", (d) => {
      return x(d.landSurface);
    })
    .attr("cy", (d) => {
      return y(d.price);
    })
    .attr("r", 3)
    .on('mouseover', (e, d) => showTooltip(d))
    .on('mouseout', () => hideTooltip())
    .on("click",function(e, d){ window.open(d.url, '_blank') });

  // Add titles
  svg.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('dy', -margins.top + 18)
    .attr('class', 'smallMultiple__title')
    .text(level)
}

function showTooltip (data) {
  const { price, landSurface, street, number, type, gemeente } = data
  const $tooltip = d3.select('.smallMultiple__tooltip')

  $tooltip.html(`
    <h4 class="tooltip__subtitle">${type}</h4>
    <h3 class="tooltip__title">${street} ${number}, ${gemeente}</h3>
    <table class="tooltip__table">
      <tr>
        <td>Prijs (€)</td>
        <td>${d3.format(",.2r")(price)}</td>
      </tr>
      <tr>
        <td>Oppervlakte (m2)</td>
        <td>${d3.format(",.2r")(Math.round(landSurface))}</td>
      </tr>
    </table>
    `)

  const tooltipHeight = $tooltip.node().getBoundingClientRect().height
  let tooltipX = event.pageX
  let tooltipY = event.pageY + 12

  if (tooltipX > window.innerWidth / 2) {
    tooltipX -= 260 + 24;
  }

  $tooltip.style('left', `${tooltipX}px`)
  $tooltip.style('top', `${tooltipY}px`)

  $tooltip.classed('smallMultiple__tooltip--visible', true)
}

function hideTooltip () {
  const $tooltip = d3.select('.smallMultiple__tooltip')
  $tooltip.classed('smallMultiple__tooltip--visible', false)
}

function makeMap(mapData) {

  const map = new maplibregl.Map({
    container: document.querySelector('.map'),
    style: 'data/style/positron.json',
    center: [4.83717117743715, 51.17657720379628],
    minzoom: 10,
    // center: [4.414789721765545, 51.20970396578631],
    zoom: 13
  });

  function pulseMarker() {
    setTimeout(function() {
      requestAnimationFrame(pulseMarker)
      var duration = 1500;
      var t = (performance.now() % duration) / duration;

      var radius = (size / 2) * 0.1;
      var outerRadius = (size / 2) * 0.7 * t + radius;

      map.setPaintProperty('projects-pulse', 'circle-opacity', (1 - t) * 0.25)
      map.setPaintProperty('projects-pulse', 'circle-radius', outerRadius)

    });
  }

  map.on('load', function() {
    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        firstSymbolId = layers[i].id;
        break;
      }
    }

    map.addSource('urban-areas', {
      'type': 'geojson',
      'data': mapData
    });

    map.addLayer({
      'id': 'projects-pulse',
      'type': 'circle',
      'source': 'urban-areas',
      "paint": {
        'circle-color': [
          'match',
          ['get', 'category'],
          'new',
          "orange",
          "rgba(0,0,0,0)"
        ],
        "circle-radius": 6
      }
    })

    // Set outer dimensions
    const { width, height } = d3.select(".map").node().getBoundingClientRect()

    pulseMarker();

    map.addLayer({
        'id': 'urban-areas-fill',
        'type': 'circle',
        'source': 'urban-areas',
        'paint': {
          'circle-color': [
            'step',
            ['get', 'price'],
            '#51bbd6',
            100,
            'orange',
            450000,
            'grey'
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': [
            'step',
            ['get', 'price'],
            '#51bbd6',
            100,
            'orange',
            450000,
            '#c1c1c1'
          ],
          'circle-opacity': 0.5,
          'circle-radius': {
            base: 1,
            stops: [
              [5, 1],
              [9, 3],
              [20, 10]
            ]
          }
        }

        // This is the important part of this example: the addLayer
        // method takes 2 arguments: the layer as an object, and a string
        // representing another layer's name. if the other layer
        // exists in the stylesheet already, the new layer will be positioned
        // right before that layer in the stack, making it possible to put
        // 'overlays' anywhere in the layer stack.
        // Insert the layer beneath the first symbol layer.
      },
      firstSymbolId
    );
  });

  map.on('click', 'urban-areas-fill', function(e) {
    var coordinates = e.features[0].geometry.coordinates.slice();
    var description =
    `
    <a href="${e.features[0].properties.url}" target='_blank'>
    <div>
    <h4 class="tooltip__subtitle">${e.features[0].properties.type}</h4>
    <h3 class="tooltip__title">${e.features[0].properties.street} ${e.features[0].properties.number}, ${e.features[0].properties.gemeente}</h3>
    </div>
    </a>
    <table class="tooltip__table">
      <tr>
        <td>Prijs (€)</td>
        <td>${d3.format(",.2r")(e.features[0].properties.price)}</td>
      </tr>
      <tr>
        <td>Oppervlakte (m2)</td>
        <td>${d3.format(",.2r")(Math.round(e.features[0].properties.landSurface))}</td>
      </tr>
    </table>
    `

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new maplibregl.Popup()
      .setLngLat(coordinates)
      .setHTML(description)
      .addTo(map);
  });

  map.on('mouseenter', 'urban-areas-fill', function() {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'urban-areas-fill', function() {
    map.getCanvas().style.cursor = '';
  });
}

function toggleMap() {
  // d3.select(".map").toggle("hide")
  d3.select(".map").classed("map--hide", d3.select(".map").classed("map--hide") ? false : true);

}
