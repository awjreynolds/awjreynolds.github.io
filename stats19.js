"use strict";



// const engineccChart = new dc.BarChart("#enginecc_chart");
const rowChartDimensions = [
  // "accident_index",
  // "location_easting_osgr",
  // "location_northing_osgr",
  // "longitude",
  // "latitude",
  // "police_force",
  "accident_severity",
  "number_of_vehicles",
  "number_of_casualties",
  // "date",
  "year",
  "month",
  "day_of_week",
  "hour",
  // "time",
  // "local_authority_district",
  // "local_authority_highway",
  "first_road_class",
  // "first_road_number",
  "road_type",
  "speed_limit",
  "junction_detail",
  "junction_control",
  "second_road_class",
  // "second_road_number",
  "pedestrian_crossing_human_control",
  "pedestrian_crossing_physical_facilities",
  "light_conditions",
  "weather_conditions",
  "road_surface_conditions",
  "special_conditions_at_site",
  "carriageway_hazards",
  "urban_or_rural_area",
  "did_police_officer_attend_scene_of_accident",
  // "lsoa_of_accident_location",
  // "vehicle_reference",
  "vehicle_type",
  "towing_and_articulation",
  "vehicle_manoeuvre",
  "vehicle_location_restricted_lane",
  "junction_location",
  "skidding_and_overturning",
  "hit_object_in_carriageway",
  "vehicle_leaving_carriageway",
  "hit_object_off_carriageway",
  "first_point_of_impact",
  "was_vehicle_left_hand_drive",
  "journey_purpose_of_driver",
  "sex_of_driver",
  "age_band_of_driver",
  "engine_capacity_cc",
  "propulsion_code",
  "age_of_vehicle",
  // "driver_imd_decile",
  "driver_home_area_type",
  "age_of_driver",
  // "vehicle_imd_decile"
];
const rowCharts = rowChartDimensions.map((d) => new dc.RowChart("#" + d));
const police_force = new dc.SelectMenu ("#police_force");
const local_authority_district = new dc.SelectMenu ("#local_authority_district");
const local_authority_highway = new dc.SelectMenu ("#local_authority_highway");



const translate = (key, value) => {
  const monthNames = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
  };

  var ageband = {
    1: "0 - 5",
    2: "6 - 10",
    3: "11 - 15",
    4: "16 - 20",
    5: "21 - 25",
    6: "26 - 35",
    7: "36 - 45",
    8: "46 - 55",
    9: "56 - 65",
    10: "66 - 75",
    11: "Over 75",
    "-1": "Data missing or out of range",
  };

  // code	label
  // 1	Most deprived 10%
  // 2	More deprived 10-20%
  // 3	More deprived 20-30%
  // 4	More deprived 30-40%
  // 5	More deprived 40-50%
  // 6	Less deprived 40-50%
  // 7	Less deprived 30-40%
  // 8	Less deprived 20-30%
  // 9	Less deprived 10-20%
  // 10	Least deprived 10%
  // -1	Data missing or out of range

  switch (key) {
    case "month": 
      return monthNames[value];
    case "age_band_of_driver":
      return ageband[value];
    default:
      return value;
  }
}
https://drive.google.com/uc?id=1cHihqGEe4Xw5F2n9E2_JX1FwemgvqeIV&export=download
//single_vehicle_pedestrian_collisions_2013-2018.csv
d3.csv("single_vehicle_pedestrian_collisions_2018.csv").then(function (
  stats19
) {
  stats19.forEach(function (x) {
    // Round to nearest 100cc
    x.engine_capacity_cc =
      (Math.round(+x.engine_capacity_cc / 100) * 100);
    var dateArr = x.date.split("-");
    x.year = +dateArr[0];
    x.month = +dateArr[1];
    x.hour = x.time.split(":")[0];
  });
  const ndx = crossfilter(stats19);
  // Declare chart dimensions and groups holders
  const chartDimensions = {},
    chartGroups = {};
  rowChartDimensions.forEach((d, i) => {
    chartDimensions[d] = ndx.dimension((dim) => dim[d]);
    switch (d) {
      case "accident_severity":
        // KSI counts should reflect number of casualties not the record count.
        chartGroups[d] = chartDimensions[d].group().reduceSum(di=> +di.number_of_casualties);
        break;
      default:
        chartGroups[d] = chartDimensions[d].group()
    }
    chartGroups[d] = chartDimensions[d].group();
    let height = chartGroups[d].size() * 15 < 200 ? 200 : chartGroups[d].size() * 15;
    rowCharts[i]
      .width(200)
      .height(height)
      .margins({ top: 20, left: 10, right: 10, bottom: 30 })
      .dimension(chartDimensions[d])
      .group(chartGroups[d])
      // Title sets the row text
      .label((e) => translate(d, e.key))
      
      .elasticX(true)
      .xAxis()
      .ticks(4);
  });

  // var engineccDimension = ndx.dimension((d) => +d.engine_capacity_cc),
  //   engineccSumGroup = engineccDimension.group();

  // engineccChart
  //   .width(600)
  //   .height(200)
  //   .margins({ top: 20, left: 10, right: 10, bottom: 20 })
  //   .dimension(engineccDimension)
  //   .group(engineccSumGroup)
  //   .x(d3.scaleLinear().domain([0, 5]))
  //   // .elasticX(true)
  //   .elasticY(true)
  //   .xAxis()
  //   .ticks(10);

  const police_force_d = ndx.dimension( d => d.police_force),
  police_force_g = police_force_d.group();
  police_force.dimension(police_force_d).group(police_force_g);


  const local_authority_district_d = ndx.dimension( d => d.local_authority_district),
  local_authority_district_g = local_authority_district_d.group();
  local_authority_district.dimension(local_authority_district_d).group(local_authority_district_g);
  const local_authority_highway_d = ndx.dimension( d => d.local_authority_highway),
  local_authority_highway_g = local_authority_highway_d.group();
  local_authority_highway.dimension(local_authority_highway_d).group(local_authority_highway_g);

  const all = ndx.groupAll();
  dc.dataCount(".dc-data-count")
  .crossfilter(ndx)
  .groupAll(all);

  dc.renderAll();
  rowCharts.forEach((rc, i) =>
    rc
      .svg()
      .append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", rc.width() / 2)
      .attr("y", rc.height()-2)
      .text(rowChartDimensions[i])
  );
});
