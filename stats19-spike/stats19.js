"use strict";



// const engineccChart = new dc.BarChart("#enginecc_chart");
const rowChartDimensions = [
  "year", "month", "hour", "Day_of_Week",
  "Accident_Severity", "Police_Force", "Local_Authority_District", "Local_Authority_Highway",  "Number_of_Vehicles", "Number_of_Casualties",
  "1st_Road_Class", "Road_Type", "Speed_limit", "Junction_Detail", "Junction_Control", "2nd_Road_Class"
  , "Pedestrian_Crossing-Human_Control", "Pedestrian_Crossing-Physical_Facilities", "Light_Conditions", "Weather_Conditions",
  "Road_Surface_Conditions", "Special_Conditions_at_Site", "Carriageway_Hazards", "Urban_or_Rural_Area", "Did_Police_Officer_Attend_Scene_of_Accident"
];
const casualtiesRowChartDimensions = [
  "Casualty_Class", "Sex_of_Casualty", "Age_Band_of_Casualty", "Casualty_Severity", "Pedestrian_Location", "Pedestrian_Movement", "Car_Passenger", "Bus_or_Coach_Passenger",
  "Casualty_Type", "Casualty_Home_Area_Type", "Casualty_IMD_Decile"
];

const vehiclesRowChartDimensions = [
  "Vehicle_Type", "Towing_and_Articulation"
  , "Vehicle_Manoeuvre", "Vehicle_Location-Restricted_Lane", "Junction_Location", "Skidding_and_Overturning", "Hit_Object_in_Carriageway", "Vehicle_Leaving_Carriageway", "Hit_Object_off_Carriageway", "1st_Point_of_Impact", "Was_Vehicle_Left_Hand_Drive", "Journey_Purpose_of_Driver", "Sex_of_Driver", "Age_Band_of_Driver", "Engine_Capacity_CC", "Propulsion_Code", "Driver_IMD_Decile", "Driver_Home_Area_Type", "Vehicle_IMD_Decile"

]
const rowCharts = rowChartDimensions.map((d) => new dc.RowChart("#Chart_" + d));

const casualtiesRowCharts = casualtiesRowChartDimensions.map((d) => new dc.RowChart("#Chart_" + d));
const vRowCharts = vehiclesRowChartDimensions.map((d) => new dc.RowChart("#Chart_" + d));
const police_force = new dc.SelectMenu("#sPolice_Force");
const local_authority_district = new dc.SelectMenu("#sLocal_authority_district");
const local_authority_highway = new dc.SelectMenu("#sLocal_authority_highway");


const translate = (key, value) => {

  return stats19lookup[key] ? stats19lookup[key][value] : value;

}
let addChartText = null;
const yearToUse = "2015";
const maxRows = 15;
const yearsToUse = window.location.href.indexOf("localhost") != -1 ? ["2013","2014","2015", "2016", "2017", "2018"] : ["2016", "2017", "2018"];
// const yearsToUse = ["2013","2014","2015", "2016", "2017", "2018"];
const accidentPromises = yearsToUse.map(y => d3.csv("dftRoadSafetyData_Accidents_" + y + ".csv"));
const casualtyPromises = yearsToUse.map(y => d3.csv("dftRoadSafetyData_Casualties_" + y + ".csv"));
const vehiclesPromises = yearsToUse.map(y => d3.csv("dftRoadSafetyData_Vehicles_" + y + ".csv"));
Promise.all(accidentPromises).then(accidentsArr =>
  Promise.all(casualtyPromises).then(casualtiesArr =>
    Promise.all(vehiclesPromises).then(vehiclesArr => {
      const accidents = [].concat.apply([], accidentsArr);
      const casualties = [].concat.apply([], casualtiesArr);
      const vehicles = [].concat.apply([], vehiclesArr);
      accidents.forEach(d => {
        d["Local_Authority_District"] = d["Local_Authority_(District)"];
        d["Local_Authority_Highway"] = d["Local_Authority_(Highway)"];
      });
      // Create the vehicleLookUp
      const vehiclesHashmap = {};
      vehicles.forEach(d => {
        d["Engine_Capacity_CC"] = (Math.round(+d["Engine_Capacity_(CC)"] / 100) * 100);
        d["Was_Vehicle_Left_Hand_Drive"] = d["Was_Vehicle_Left_Hand_Drive?"];
        if (vehiclesHashmap[d.Accident_Index])
          vehiclesHashmap[d.Accident_Index].push(d);
        else
          vehiclesHashmap[d.Accident_Index] = [d]
      })
      const casualtiesHashmap = {};
      casualties.forEach(d => {
        // Allocate vehicle that hit them
        d["vehicle"] = vehiclesHashmap[d.Vehicle_Reference];
        if (casualtiesHashmap[d.Accident_Index])
          casualtiesHashmap[d.Accident_Index].push(d);
        else
          casualtiesHashmap[d.Accident_Index] = [d]
      })

      accidents.forEach(d => {
        d.casualties = casualtiesHashmap[d.Accident_Index] ? casualtiesHashmap[d.Accident_Index] : [];
        d.vehicles = vehiclesHashmap[d.Accident_Index] ? vehiclesHashmap[d.Accident_Index] : [];
      })
      accidents.forEach(function (x) {
        var dateArr = x.Date.split("/");
        x.year = +dateArr[2];
        x.month = +dateArr[1];
        x.hour = x.Time.split(":")[0];
      });
      const ndx = crossfilter(accidents);
      const remove_empty_bins = (source_group) => {
        return {
            all: () => {
                return source_group.all().filter(function(d) {
                    return d.value != 0;
                });
            },
            size: () => source_group.size()

        };
    }
      // Declare chart dimensions and groups holders
      const chartDimensions = {},
        chartGroups = {};
      rowChartDimensions.forEach((d, i) => {
        chartDimensions[d] = ndx.dimension((dim) => dim[d]);

        chartGroups[d] = remove_empty_bins(chartDimensions[d].group());
        let height = chartGroups[d].size() * 15 < maxRows * 15 ? maxRows * 15 : (chartGroups[d].size() > maxRows ? maxRows : chartGroups[d].size()) * 15;
        rowCharts[i]
          .width(200)
          .height(height)
          .margins({ top: 20, left: 10, right: 10, bottom: 30 })
          .dimension(chartDimensions[d])
          .group(chartGroups[d])
          // Title sets the row text
          .label((e) => translate(d, e.key))
          .cap(maxRows)
          .elasticX(true)
          .xAxis()
          .ticks(4);
      });

      casualtiesRowChartDimensions.forEach((d, i) => {
        // Array based dimension set
        chartDimensions[d] = ndx.dimension((dim) => dim.casualties.map(c => c[d]), true);
        chartGroups[d] = remove_empty_bins(chartDimensions[d].group());
        let height = chartGroups[d].size() * 15 < maxRows * 15 ? maxRows * 15 : (chartGroups[d].size() > maxRows ? maxRows : chartGroups[d].size()) * 15;
        casualtiesRowCharts[i]
          .width(200)
          .height(height)
          .margins({ top: 20, left: 10, right: 10, bottom: 30 })
          .dimension(chartDimensions[d])
          .group(chartGroups[d])
          // Title sets the row text
          .label((e) => translate(d, e.key))
          .cap(maxRows)
          .elasticX(true)
          .xAxis()
          .ticks(4);
      });
      vehiclesRowChartDimensions.forEach((d, i) => {
        // Array based dimension set
        chartDimensions[d] = ndx.dimension((dim) => dim.vehicles.map(c => c[d]), true);
        chartGroups[d] = remove_empty_bins(chartDimensions[d].group());
        let height = chartGroups[d].size() * 15 < maxRows * 15 ? maxRows * 15 : (chartGroups[d].size() > maxRows ? maxRows : chartGroups[d].size()) * 15;
        vRowCharts[i]
          .width(200)
          .height(height)
          .margins({ top: 20, left: 10, right: 10, bottom: 30 })
          .dimension(chartDimensions[d])
          .group(chartGroups[d])
          // Title sets the row text
          .label((e) => translate(d, e.key))
          .cap(maxRows)
          .elasticX(true)
          .xAxis()
          .ticks(4);
      });


      const police_force_d = ndx.dimension(d => translate("Police_Force", d.Police_Force)),
        police_force_g = police_force_d.group();
      police_force.dimension(police_force_d).group(police_force_g);


      const local_authority_district_d = ndx.dimension(d => translate("Local_Authority_(District)", d["Local_Authority_(District)"])),
        local_authority_district_g = local_authority_district_d.group();
      local_authority_district.dimension(local_authority_district_d).group(local_authority_district_g);
      const local_authority_highway_d = ndx.dimension(d => translate("Local_Authority_(Highway)", d["Local_Authority_(Highway)"])),
        local_authority_highway_g = local_authority_highway_d.group();
      local_authority_highway.dimension(local_authority_highway_d).group(local_authority_highway_g);

      const all = ndx.groupAll();
      dc.dataCount(".dc-data-count")
        .crossfilter(ndx)
        .groupAll(all);

      dc.renderAll();
      addChartText = () => {
        rowCharts.forEach((rc, i) =>
          rc
            .svg()
            .append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", rc.width() / 2)
            .attr("y", rc.height() - 2)
            .text(rowChartDimensions[i])
        );

        casualtiesRowCharts.forEach((rc, i) =>
          rc
            .svg()
            .append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", rc.width() / 2)
            .attr("y", rc.height() - 2)
            .text(casualtiesRowChartDimensions[i])
        );
        vRowCharts.forEach((rc, i) =>
          rc
            .svg()
            .append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", rc.width() / 2)
            .attr("y", rc.height() - 2)
            .text(vehiclesRowChartDimensions[i])
        );
      };
      addChartText();

    })));