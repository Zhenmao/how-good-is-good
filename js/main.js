d3.csv("data/data.csv").then((csv) => {
  ///////////////////////////////////////////////////////////
  //// Data processing //////////////////////////////////////
  ///////////////////////////////////////////////////////////
  const data = processData(csv);
  function processData(csv) {
    const valueAccessor = (d) => (d["Total"] === "-" ? 0 : Number(d["Total"]));

    const data = Array.from(
      d3.rollup(
        csv,
        (v) => {
          const values = v.slice(2, 13).map(valueAccessor);
          const average = valueAccessor(v[14]);
          return {
            values,
            average,
          };
        },
        (d) => d["Word"],
      ),
      ([word, d]) => ({ word, ...d }),
    );
    data.sort((a, b) => d3.ascending(a.average, b.average));
    return data;
  }

  ///////////////////////////////////////////////////////////
  //// Setup ////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////
  const scores = d3.range(0, 11);

  const labelPaddingX = 12;
  const labelPaddingY = 8;
  const marginTop = 144;
  const marginRight = 12;
  const marginBottom = 44;
  const wordWidth = 116;
  const averageWidth = 32;
  const marginLeft = wordWidth + averageWidth + labelPaddingX * 2;
  const gridSize = 56;
  const width = marginLeft + marginRight + gridSize * scores.length;
  const height = marginTop + marginBottom + gridSize * data.length;
  const averageRadius = 4;

  const xScale = d3
    .scalePoint()
    .domain(scores)
    .range([marginLeft, width - marginRight])
    .padding(0.5);

  const averageScale = d3
    .scaleLinear()
    .domain([scores.at(0), scores.at(-1)])
    .range([xScale(scores.at(0)), xScale(scores.at(-1))]);

  const yScale = d3
    .scalePoint()
    .domain(data.map((d) => d.word))
    .range([marginTop, height - marginBottom])
    .padding(0.5);

  const fullGridValue = 0.4;
  const rScale = d3
    .scaleSqrt()
    .domain([0, fullGridValue])
    .range([0, gridSize / 2]);

  const formatValue = new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format;

  const formatAverage = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format;

  const formatScore = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format;

  ///////////////////////////////////////////////////////////
  //// Render ///////////////////////////////////////////////
  ///////////////////////////////////////////////////////////
  const container = d3.select("#figure").classed("heatmap", true);

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

  //// Legend //////////////////////////////////////////
  const legendTicks = [0.01, 0.05, 0.1, 0.5].reverse();
  const swatchGap = 16;
  let swatchX = 214; // Magic number to align legend title with main body text
  const swatchXs = legendTicks.reduce((xs, tick, i) => {
    if (i > 0) swatchX += rScale(tick);
    xs.push(swatchX);
    swatchX += rScale(tick) + swatchGap;
    return xs;
  }, []);

  const legendsG = svg
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      `translate(0,${Math.ceil(rScale(d3.max(legendTicks)) * 2)})`,
    );

  const sizeLegendG = legendsG.append("g");

  sizeLegendG
    .append("text")
    .attr("class", "legend__title")
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "text-before-edge")
    .attr("x", swatchXs[0] - gridSize / 2 - labelPaddingX)
    .attr("y", labelPaddingY)
    .text("Response percentage");

  const swatchG = sizeLegendG
    .selectChildren(".swatch")
    .data(legendTicks)
    .join("g")
    .attr("class", "size-legend")
    .attr("transform", (_, i) => `translate(${swatchXs[i]},0)`);

  swatchG
    .append("circle")
    .attr("class", "swatch__bubble")
    .attr("cy", (d) => -rScale(d))
    .attr("r", (d) => rScale(d));

  swatchG
    .append("text")
    .attr("class", "swatch__value")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "text-before-edge")
    .attr("y", labelPaddingY)
    .text(formatValue);

  const averageLegendG = legendsG
    .append("g")
    .attr("transform", `translate(${swatchXs.at(-1) + 200},0)`);

  averageLegendG
    .append("text")
    .attr("class", "legend__title")
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "text-before-edge")
    .attr("y", labelPaddingY)
    .text("Average score");

  averageLegendG
    .append("circle")
    .attr("class", "swatch__average")
    .attr("cx", labelPaddingX + averageRadius)
    .attr("cy", labelPaddingY + 10) // Magic number
    .attr("r", averageRadius);

  //// Column headers ///////////////////////////////////////
  svg
    .append("g")
    .attr("class", "column__headers")
    .selectChildren(".column__header")
    .data([
      { y: marginTop - labelPaddingY, dominantBaseline: "text-after-edge" },
      {
        y: height - marginBottom + labelPaddingY,
        dominantBaseline: "text-before-edge",
      },
    ])
    .join("text")
    .attr("class", "column__header")
    .attr("text-anchor", "end")
    .attr("dominant-baseline", (d) => d.dominantBaseline)
    .attr("x", wordWidth + labelPaddingX + averageWidth)
    .attr("y", (d) => d.y)
    .text("Avg.");

  //// X axis ///////////////////////////////////////////////
  const xAxisG = svg.append("g").attr("class", "axis");

  const tickG = xAxisG
    .append("g")
    .attr("class", "ticks")
    .selectChildren(".tick")
    .data(scores)
    .join("g")
    .attr("class", "tick")
    .attr("transform", (d) => `translate(${xScale(d)},0)`);

  tickG
    .selectChildren("text")
    .data([
      { y: marginTop - labelPaddingY, dominantBaseline: "text-after-edge" },
      {
        y: height - marginBottom + labelPaddingY,
        dominantBaseline: "text-before-edge",
      },
    ])
    .join("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", (d) => d.dominantBaseline)
    .attr("y", (d) => d.y)
    .text(function () {
      return formatScore(d3.select(this.parentNode).datum());
    });

  tickG
    .append("line")
    .attr("y1", marginTop)
    .attr("y2", height - marginBottom);

  xAxisG
    .append("g")
    .attr("class", "tick__descriptions")
    .selectChildren(".tick__description")
    .data([
      {
        x: xScale(scores.at(0)),
        y: marginTop - labelPaddingY,
        dy: "-1.2em",
        dominantBaseline: "text-after-edge",
        text: "Very negative",
      },
      {
        x: xScale(scores.at(-1)),
        y: marginTop - labelPaddingY,
        dy: "-1.2em",
        dominantBaseline: "text-after-edge",
        text: "Very positive",
      },
      {
        x: xScale(scores.at(0)),
        y: height - marginBottom + labelPaddingY,
        dy: "1.2em",
        dominantBaseline: "text-before-edge",
        text: "Very negative",
      },
      {
        x: xScale(scores.at(-1)),
        y: height - marginBottom + labelPaddingY,
        dy: "1.2em",
        dominantBaseline: "text-before-edge",
        text: "Very positive",
      },
    ])
    .join("text")
    .attr("class", "tick__description")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", (d) => d.dominantBaseline)
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("dy", (d) => d.dy)
    .text((d) => d.text);

  //// Rows /////////////////////////////////////////////////
  const rowG = svg
    .append("g")
    .attr("class", "rows")
    .selectChildren(".row")
    .data(data)
    .join("g")
    .attr("class", "row")
    .attr("transform", (d) => `translate(0,${yScale(d.word)})`);

  rowG
    .append("text")
    .attr("class", "row__title")
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "central")
    .attr("x", wordWidth)
    .text((d) => d.word);

  rowG
    .append("text")
    .attr("class", "row__average")
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "central")
    .attr("x", wordWidth + labelPaddingX + averageWidth)
    .text((d) => formatAverage(d.average));

  rowG
    .append("g")
    .attr("class", "row__cells")
    .selectChildren(".cell__bubble")
    .data((d) => d.values)
    .join("circle")
    .attr("class", "cell__bubble")
    .attr("cx", (_, i) => xScale(i))
    .attr("r", (d) => rScale(d));

  rowG
    .append("circle")
    .attr("class", "row__average-marker")
    .attr("r", averageRadius)
    .attr("cx", (d) => averageScale(d.average));
});
