// Dimensions of sunburst.
var width = 750;
var height = 600;
var radius = Math.min(width, height) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
    w: 75, h: 30, s: 3, t: 10
};

// Mapping of step names to colors.
var colors = {
    "bioinformatics": "#5687d1",
    "unix": "#7b615c",
    "setup": "#de783b",
    "intro": "#6ab975",
    "commands": "#a173d1",
    "structure": "#6ab975",
    "variables": "#bbbbbb",
    "forloop": "#a173d1",

    "r": "#5687d1",
    "data": "#7b615c",
    "tidyverse": "#de783b",
    "plotting": "#6ab975",
    "barplot": "#a173d1",
    "linearmodel": "#6ab975",


    "functionalannotation": "#5687d1",
    "blast": "#7b615c",
    "HMMER": "#de783b",
    "alignsequences": "#6ab975",
    "fegenie": "#a173d1",
    "HMM": "#6ab975",

    "amplicons": "#5687d1",
    "workflow": "#7b615c",
    "dada2": "#de783b",

    "metagenomics": "#5687d1",
    "qualitycontrol": "#7b615c",
    "taxonomicclassification": "#de783b",
    "genomeassembly": "#6ab975",
    "transcriptomics": "#a173d1",
    "rRNA": "#6ab975",

};

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0;

//SVG
var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

var partition = d3.partition()
    .size([2 * Math.PI, radius * radius]);

var arc = d3.arc()
    .startAngle(function (d) { return d.x0; })
    .endAngle(function (d) { return d.x1; })
    .innerRadius(function (d) { return Math.sqrt(d.y0); })
    .outerRadius(function (d) { return Math.sqrt(d.y1); });


// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

//Initialize an empty array of notes
var notes = []

var notesContainer = document.getElementById("notes")




// Use d3.text and d3.csvParseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays.
d3.text("Bioinformatics.csv", function (text) {
    var csv = d3.csvParseRows(text);
    var json = buildHierarchy(csv);
    createVisualization(json);
});

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {

    // Basic setup of page elements.
    initializeBreadcrumbTrail();
    //Legend with different colors
    drawLegend();
    //User clicks toggle
    d3.select("#togglelegend").on("click", toggleLegend);
    //User clicks view saved notes button
    d3.select("#viewSavedNotes").on("click", viewSavedNotes);

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    vis.append("svg:circle")
        .attr("r", radius)
        .style("opacity", 0);

    // Turn the data into a d3 hierarchy and calculate the sums.
    var root = d3.hierarchy(json)
        .sum(function (d) { return 1;/*.size;*/ })
        .sort(function (a, b) {
            return b.value - a.value;
        });

    // For efficiency, filter nodes to keep only those large enough to see.
    var nodes = partition(root).descendants()
        .filter(function (d) {
            console.log(d.x1 - d.x0)
            return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
        });

    group = vis.data([json]).selectAll("path")
        .data(nodes)
        .enter().append('svg:g');

    path = group.append("svg:path")
        .attr("display", function (d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", function (d) { return colors[d.data.name]; })
        .style("opacity", 1)
        .text("Testing")
        .on("mouseover", mouseover)
        .on("click", click)

    var path = vis.data([json]).selectAll("path")
        .data(nodes)
        .enter().append("svg:path")
        .attr("display", function (d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", function (d) { return colors[d.data.name]; })
        .style("opacity", 1)
        .text("Testing")
        .on("mouseover", mouseover)
        .on("click", click)

    // Add the mouseleave handler to the bounding circle.
    d3.select("#container").on("mouseleave", mouseleave);

    // Get total size of the tree = value of root node from partition.
    // totalSize = path.datum().value;
};

//Calculate the names of the children of a node in the middle of the diagram
function calculateChildren(d) {
    var childrenString = ""
    var children = d.data.children

    if (children == undefined) {
        return childrenString;
    }

    //Maybe add color to each
    children.forEach(element => {
        //Add children name to the string
        childrenString += (element.name) += " "
    })

    return childrenString
}

function click(d) {
    notes.push(d.data)
}

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

    console.log(d)

    d3.select("#percentage")
        .text(d.data.name)

    d3.select("#children")
        .text(calculateChildren(d));

    d3.select("#explanation")
        .style("visibility", "");

    var sequenceArray = d.ancestors().reverse();
    sequenceArray.shift(); // remove root node from the array
    //updateBreadcrumbs(sequenceArray, d.data.name);
    updateBreadcrumbs(sequenceArray, d);

    // Fade all the segments.
    d3.selectAll("path")
        .style("opacity", 0.3)
        .text("Testing");

    // Then highlight only those that are an ancestor of the current segment.
    vis.selectAll("path")
        .filter(function (node) {
            return (sequenceArray.indexOf(node) >= 0);
        })
        .style("opacity", 1);

    //Update title
    document.getElementById("title").style.visibility = "visible";
    document.getElementById("title").innerHTML = d.data.name


    //Update Description
    document.getElementById("description").style.visibility = "visible";

    //Reset Description
    document.getElementById("description").innerHTML = ""

    //Check if there are any other characters other than space. Ran into errors where this would pass with null strings hence the regex
    if (/\S/.test(d.data.description) && d.data.description != undefined) {
        console.log("Description:" + d.data.description)
        //Split by newline
        var dataArray = d.data.description.split("\n")

        document.getElementById("description").visibility = "visible"

        for (i in dataArray) {

            //New line
            if (dataArray[i] === "") {
                //Double space
                document.getElementById("description").innerHTML += "<br><br>"
            }
            else {
                document.getElementById("description").innerHTML += dataArray[i]
            }

        }
    }
    else {
        document.getElementById("description").innerHTML = ""
    }

    //Update code

    var codeBlock = document.getElementById("code")

    //If code block is not empty
    if (/\S/.test(d.data.code) && d.data.code != undefined) {
        //Showcase the block
        codeBlock.style.visibility = "visible";
        //PR.prettyPrintOne allows for colors to refresh else black syntax
        console.log("Updated Code")
        codeBlock.innerHTML = PR.prettyPrintOne(d.data.code, 'bsh');
    } else {
        //Hide the block
        codeBlock.style.visibility = "hidden";
        codeBlock.innerHTML = ""
    }
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

    // Hide the breadcrumb trail
    d3.select("#trail")
        .style("visibility", "hidden");

    // Deactivate all segments during transition.
    d3.selectAll("path").on("mouseover", null);

    // Transition each segment to full opacity and then reactivate it.
    d3.selectAll("path")
        .transition()
        .duration(1000)
        .text("Testing")
        .style("opacity", 1)
        .on("end", function () {
            d3.select(this).on("mouseover", mouseover);
        })
        ;

    d3.select("#explanation")
        .style("visibility", "hidden");
}

function initializeBreadcrumbTrail() {
    // Add the svg area.
    var trail = d3.select("#sequence").append("svg:svg")
        .attr("width", width)
        .attr("height", 50)
        .attr("id", "trail");
    // Add the label at the end, for the percentage.
    trail.append("svg:text")
        .attr("id", "endlabel")
        .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
    var points = [];
    points.push("0,0");
    points.push(b.w + ",0");
    points.push(b.w + b.t + "," + (b.h / 2));
    points.push(b.w + "," + b.h);
    points.push("0," + b.h);
    if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
        points.push(b.t + "," + (b.h / 2));
    }
    return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

    // Data join; key function combines name and depth (= position in sequence).
    var trail = d3.select("#trail")
        .selectAll("g")
        .data(nodeArray, function (d) { return d.data.name + d.depth; });

    // Remove exiting nodes.
    trail.exit().remove();

    // Add breadcrumb and label for entering nodes.
    var entering = trail.enter().append("svg:g");

    entering.append("svg:polygon")
        .attr("points", breadcrumbPoints)
        .style("fill", function (d) {
            console.log(colors[d.data.name])
            return colors[d.data.name];
        });

    entering.append("svg:text")
        .attr("x", (b.w + b.t) / 2)
        .attr("y", b.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(function (d) { return d.data.name; });

    // Merge enter and update selections; set position for all nodes.
    entering.merge(trail).attr("transform", function (d, i) {
        return "translate(" + i * (b.w + b.s) + ", 0)";
    });

    // Now move and update the percentage at the end.
    d3.select("#trail").select("#endlabel")
        .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
        .attr("y", b.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(calculuateNumChildren(percentageString));

    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trail")
        .style("visibility", "");

}

//Calculate number of topics below this topic. If none, return nothing
function calculuateNumChildren(d) {
    console.log(d)
    if (typeof d.data.children == "undefined") {
        return ""
    }
    else {
        if (d.data.children.length <= 1) {
            return d.data.children.length + " topic"
        }
        return d.data.children.length + " topics"
    }
}


function drawLegend() {

    // Dimensions of legend item: width, height, spacing, radius of rounded rect.
    var li = {
        w: 75, h: 30, s: 3, r: 3
    };

    var legend = d3.select("#legend").append("svg:svg")
        .attr("width", li.w)
        .attr("height", d3.keys(colors).length * (li.h + li.s));

    var g = legend.selectAll("g")
        .data(d3.entries(colors))
        .enter().append("svg:g")
        .attr("transform", function (d, i) {
            return "translate(0," + i * (li.h + li.s) + ")";
        });

    g.append("svg:rect")
        .attr("rx", li.r)
        .attr("ry", li.r)
        .attr("width", li.w)
        .attr("height", li.h)
        .style("fill", function (d) { return d.value; });

    g.append("svg:text")
        .attr("x", li.w / 2)
        .attr("y", li.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(function (d) { return d.key; });
}

function toggleLegend() {
    var legend = d3.select("#legend");
    if (legend.style("visibility") == "hidden") {
        legend.style("visibility", "");
    } else {
        legend.style("visibility", "hidden");
    }
}

//Notes modal
function viewSavedNotes() {

    if (notes.length == 0) {
        notesContainer.innerHTML = "Click a path to save a note"
    } else {
        //Reset notes
        notesContainer.innerHTML = "";
    }
    notes.forEach(element => {
        //Title
        notesContainer.innerHTML += ("<h3>" + element.name + "</h3>");

        //Description
        if ((/\S/.test(element.description) && element.description != undefined)) {
            notesContainer.innerHTML += ("<p>" + element.description + "</p>");
        }
        //Code
        if ((/\S/.test(element.code) && element.code != undefined)) {
            notesContainer.innerHTML += ("<pre class='prettyprint' id='notesCode'>" + element.code + "</pre>");
            //Restart the function for the code color
            //notesCode.innerHTML = PR.prettyPrintOne(element.code, 'bsh');
        }
        //Description
        if ((/\S/.test(element.description) && element.description != undefined)) {
            notesContainer.innerHTML += ("<p>" + element.description + "</p>");
        }

        //Space Between
        notesContainer.innerHTML += ("<br/><br/>");
    });

    var modal = document.getElementById("myModal");
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    modal.style.display = "none";
}



// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how 
// often that sequence occurred.
function buildHierarchy(csv) {
    var root = { "name": "root", "children": [] };
    for (var i = 0; i < csv.length; i++) {
        var sequence = csv[i][0]; //bioinformatics-setup-
        var description = csv[i][1]; //paragraph 
        var code = csv[i][2] //code

        /*if (isNaN(size)) { // e.g. if this is a header row, is not a number
          continue; //Skip the loop
        }*/


        var parts = sequence.split("-");
        var currentNode = root;
        for (var j = 0; j < parts.length; j++) {
            var children = currentNode["children"];
            console.log("currentnode" + currentNode)


            if(children == undefined){
                break;
            }


            var nodeName = parts[j];
            var childNode;
            if (j + 1 < parts.length) {
                // Not yet at the end of the sequence; move down the tree.
                var foundChild = false;
                for (var k = 0; k < children.length; k++) {
                    if (children[k]["name"] == nodeName) {
                        childNode = children[k];
                        foundChild = true;
                        break;
                    }
                }
                // If we don't already have a child node for this branch, create it.
                if (!foundChild) {
                    childNode = { "name": nodeName, "children": [] };
                    children.push(childNode);
                }
                currentNode = childNode;
            } else {
                // Reached the end of the sequence; create a leaf node.
                childNode = { "name": nodeName, "description": description, "code": code };
                console.log(nodeName)
                //console.log("Childnode" + childNode)
                //console.log("children" + children)
                children.push(childNode);
            }
        }
    }
    return root;
};
