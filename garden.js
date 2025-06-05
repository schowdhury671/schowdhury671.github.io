// turn the flat representation into a tree

var flowerTemplateHTML = $('#flower_template').html();

var garden_height = 580;
// alert($('body').width());
// if($('body').width() < 768) {
//     garden_height *= 2;
//     alert('mobile');
// }
// const plantWidth = garden.width() / research_garden.length;
const plantWidth = 400;
var root_stem_height = 70;
var root_offset = 60;
var stem_height = 80;

const waveWidth = 150, wave_offset = 80, waveHeight = 50;
const cloudWidth = 75, cloudHeight = 30, cloud_offset = 0;
var research_garden = [];
var id2paper = {};

function build_garden(papers) {
    research_garden = [];
    id2paper = {};
    for(var paper of papers) {
        id2paper[paper.id] = paper;
        
        if(paper.root_node) {
            research_garden.push({plant_name: paper.root_name, flower_color: paper.root_color, papers: [paper]});
        }
        else {
            var parent = id2paper[paper.parent];
            if(!parent.children) {
                parent.children = [];
            }
            parent.children.push(paper);
        }
    }

    var garden_width = plantWidth*research_garden.length+100;
    $('#garden').width(garden_width).height(garden_height);
    $('#garden_container'); // .width(garden_width).height
    
    calculate_coauthors(papers);
    renderGarden();
}

var flower_positions = {};

function createPlant(plant, x_pos, plant_index) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x_pos}, ${garden_height})`);

    // Add plant name
    const nameLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    nameLabel.setAttribute("class", "direction-label");
    nameLabel.setAttribute("x", "0");
    nameLabel.setAttribute("y", `-${root_offset-15}`);
    const lines = plant.plant_name.split('\n');
    lines.forEach((line, index) => {
        const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        tspan.textContent = line;
        tspan.setAttribute("x", "0");
        tspan.setAttribute("y", `${(index-1)*1.0-0.8}em`);
        tspan.setAttribute("class", `plant_label${index}`);
        nameLabel.appendChild(tspan);
    });

    // let's add a straight root stem
    const rootStem = document.createElementNS("http://www.w3.org/2000/svg", "path");
    rootStem.setAttribute("class", "stem root_stem");
    rootStem.setAttribute("d", `M0,-${root_offset} L0,-${root_stem_height+root_offset}`);
    g.appendChild(rootStem);
    g.flower_color = plant.flower_color;
    g.appendChild(nameLabel);

    plant.papers.forEach((paperTree, index) => {
        drawPaperTree(g, paperTree, 0, -(root_stem_height+root_offset), x_pos, plant_index);
    });

    return g;
}
function get_whiter_color(color, factor) {
    // the color is in the format #RRGGBB
    var r = parseInt(color.slice(1, 3), 16);
    var g = parseInt(color.slice(3, 5), 16);
    var b = parseInt(color.slice(5, 7), 16);
    r = Math.min(255, r + factor);
    g = Math.min(255, g + factor);
    b = Math.min(255, b + factor);
    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}
function drawPaperTree(parentElement, paper, x_offset, y_offset, plant_x_pos, plant_index) {
    flower_positions[paper.id] = {x: x_offset+plant_x_pos, y: y_offset};

    paper.flower_color = parentElement.flower_color;            
    var flower_class = `plant_${plant_index}`;
    
    var whiter_color = get_whiter_color(paper.flower_color, -30);
    var additional_css = `.${flower_class} {fill: ${whiter_color};} .flower:hover .${flower_class} {fill: ${paper.flower_color};}`;

    $('#flower_css').append(additional_css);
    // Create flower
    const flower = document.createElementNS("http://www.w3.org/2000/svg", "g");
    flower.setAttribute("class", "flower");
    flower.setAttribute('id', 'flower_'+paper.id);
    var flowerHTML = flowerTemplateHTML.replaceAll(/\[\[FLOWER_CLASS\]\]/g, flower_class);
    flowerHTML = flowerHTML.replaceAll(/\[\[X\]\]/g, 0);
    flowerHTML = flowerHTML.replaceAll(/\[\[Y\]\]/g, 0);

    // flower.innerHTML = flowerHTML;
    // instead, put the flowerHTML into a subgroup
    flowerHTML = `<g class='flower_subgroup'>${flowerHTML}</g>`;
    flower.innerHTML = flowerHTML;
    flower.setAttribute("onclick", `open_paper('${paper.id}')`);
    flower.setAttribute("transform", `translate(${x_offset}, ${y_offset})`);
    // do it without using the 
    
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "label");
    label.setAttribute("onclick", `open_paper('${paper.id}')`);

    // add the venue to the title_lines
    var titleLines = paper.title.split('\n');
    if(paper.venue) {
        titleLines.push(paper.venue);
    }
    var title_x_offset = (paper.is_left_child)?x_offset-30:x_offset+30;

    titleLines.forEach((line, index) => {
        const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        tspan.textContent = line;
        tspan.setAttribute("class", `paper_label${index} ${paper.is_left_child ? "left_child_title" : ""}`);
        tspan.setAttribute("x", title_x_offset);
        tspan.setAttribute("y", `${y_offset + 15 + (index)*20 - (0.5) * 20 * (titleLines.length)}`);
        label.appendChild(tspan);
    });

    if (paper.children) {
        if (paper.children.length == 1) {
            const child = paper.children[0];
            // this is just a straight line up
            const stem = document.createElementNS("http://www.w3.org/2000/svg", "path");
            stem.setAttribute("class", "stem");
            stem.setAttribute("d", `M${x_offset},${y_offset} L${x_offset},${y_offset-stem_height}`);
            parentElement.appendChild(stem);
            drawPaperTree(parentElement, child, x_offset, y_offset - stem_height, plant_x_pos, plant_index);
        }
        else if (paper.children.length == 2) {
            const leftChild = paper.children[0];
            leftChild.is_left_child = 1;
            const rightChild = paper.children[1];
            const leftStem = document.createElementNS("http://www.w3.org/2000/svg", "path");
            leftStem.setAttribute("class", "stem");
            leftStem.setAttribute("d", `M${x_offset},${y_offset} C${x_offset-30},${y_offset+5} ${x_offset-50},${y_offset} ${x_offset - 50},${y_offset-stem_height}`);
            parentElement.appendChild(leftStem);
            drawPaperTree(parentElement, leftChild, x_offset - 50, y_offset - stem_height, plant_x_pos, plant_index);
            const rightStem = document.createElementNS("http://www.w3.org/2000/svg", "path");
            rightStem.setAttribute("class", "stem");
            rightStem.setAttribute("d", `M${x_offset},${y_offset} C${x_offset+30},${y_offset+5} ${x_offset+50},${y_offset} ${x_offset + 50},${y_offset-stem_height}`);
            parentElement.appendChild(rightStem);
            drawPaperTree(parentElement, rightChild, x_offset + 50, y_offset - stem_height, plant_x_pos, plant_index);
        }
    }

    parentElement.appendChild(flower);

    if (paper.indirect_connections) {
        paper.indirect_connections.forEach((indirect_connection) => {
            const indirect_connection_pos = flower_positions[indirect_connection];
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("class", "indirect_connection");
            line.setAttribute("x1", x_offset+plant_x_pos);
            line.setAttribute("y1", y_offset+garden_height);
            line.setAttribute("x2", indirect_connection_pos.x);
            line.setAttribute("y2", indirect_connection_pos.y+garden_height);
            $(".indirect-connections-group").append(line);
        });
    }

    parentElement.appendChild(label);

    bringFlowersToFront();
}
function open_paper(paper_id) {
    // var paper = id2paper[paper_id];
    // window.open(paper.url, '_blank');
    // instead of that, we're going to open a centered modal with some info about the paper
    $('#paper_modal').fadeIn(200);
    $('#paper_modal_title').text(id2paper[paper_id].full_title);
    $('#paper_modal_venue').text("— " + id2paper[paper_id].venue);
    $('#paper_modal_content').text(id2paper[paper_id].summary);
    var links = `<a href='${id2paper[paper_id].url}' target='_blank'>arXiv</a>`;
    if(id2paper[paper_id].additional_links) {
        for(var link_type of Object.keys(id2paper[paper_id].additional_links)) {
            links += `<a href="${id2paper[paper_id].additional_links[link_type]}" target="_blank">${link_type}</a>`;
        }
    }
    $('#paper_modal_links').html(links);
}
function bringFlowersToFront() {
    var flowers = $(".flower");
    flowers.each(function() {
        // reappend it to its own parent
        $(this).appendTo($(this).parent());
    });
}

// Main rendering function
function renderGarden() {
    var garden_width = $('#garden').width();
    
    // Add a group for indirect connections at the start
    const indirectConnectionsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    indirectConnectionsGroup.setAttribute("class", "indirect-connections-group");
    $('#garden').append(indirectConnectionsGroup);

    // now let's add clouds, same concept, but at the top instead of bottom
    var cloudSegments = Math.ceil(garden_width / cloudWidth);
    const wavyCloud = document.createElementNS("http://www.w3.org/2000/svg", "path");
    wavyCloud.setAttribute("class", "clouds");
    let cloudPath = `M0,0 C0,${cloud_offset+0.3*cloudHeight} 0,${cloud_offset+0.7*cloudHeight} 0,${cloud_offset}`;
    for (let i = 0; i < cloudSegments; i++) {
        const x1 = i * cloudWidth;
        const x2 = (i + 1) * cloudWidth;
        const cp1x = x1 + (cloudWidth * 0.25);
        const cp2x = x1 + (cloudWidth * 0.75);

        cloudPath += `C${cp1x},${cloud_offset + 0.3 * cloudHeight} ${cp2x},${cloud_offset + 0.7 * cloudHeight} ${x2},${cloud_offset}`;
    }
    cloudPath += ` L${garden_width},0 L0,0 Z`; // Close the path by extending to top corners
    wavyCloud.setAttribute("d", cloudPath);
    $('#garden').append(wavyCloud);

    // Add wavy grass decoration at the top
    const wavyGrass = document.createElementNS("http://www.w3.org/2000/svg", "path");
    wavyGrass.setAttribute("class", "grass");
    
    // Create a wavy path using cubic bezier curves
    let wavePath = `M0,${garden_height - wave_offset} `;
    var waveSegments = Math.ceil(garden_width / waveWidth);
    for (let i = 0; i < waveSegments; i++) {
        const x1 = i * waveWidth;
        const x2 = (i + 1) * waveWidth;
        const cp1x = x1 + (waveWidth * 0.25);
        const cp2x = x1 + (waveWidth * 0.75);
        
        wavePath += `C${cp1x},${garden_height - wave_offset - 0.3 * waveHeight} ${cp2x},${garden_height - wave_offset - 0.7 * waveHeight} ${x2},${garden_height - wave_offset}`;
    }

    wavePath += ` L${garden_width},${garden_height} L0,${garden_height} Z`; // Close the path by extending to top corners
    wavyGrass.setAttribute("d", wavePath);
    $('#garden').append(wavyGrass);

    research_garden.forEach((plant, index) => {
        const x_pos = (index + 0.5) * plantWidth;
        const plantElement = createPlant(plant, x_pos, index);
        $('#garden').append(plantElement);
    });
}
function calculate_coauthors(papers) {
    // count top 10 coauthors
    var coauthor_counts = {};
    for(var i = papers.length-1; i >= 0; i--) {
        var paper = papers[i];
        for(var coauthor of paper.coauthors) {
            coauthor_counts[coauthor] = (coauthor_counts[coauthor] || 0) + 1;
        }
    }
    // sort by count
    var sorted_coauthors = Object.entries(coauthor_counts).sort((a, b) => b[1] - a[1]);
    for(var i = 0; i < 10; i++) {
        var coauthor = sorted_coauthors[i];
        var coauthor_escaped = coauthor[0].replaceAll("'", "\\'");
        $('#coauthor_list').append(`<div class="coauthor" onclick="select_coauthor('${coauthor_escaped}')">${coauthor[0]}</div>`);
    }
    // if there are no coauthors, hide the coauthor hall of fame
    if(sorted_coauthors.length == 0) {
        $('#coauthor_hall_of_fame').hide();
    }
}
var selected_coauthor = null;
function select_coauthor(coauthor) {
    if(selected_coauthor == coauthor) {
        selected_coauthor = null;
    }
    else {
        selected_coauthor = coauthor;
    }
    // iterate over papers, and add a class `.selected_flower` to the flowers that have the coauthor
    $('.flower').removeClass('selected_flower');
    for(var paper of papers) {
        if(paper.coauthors.includes(selected_coauthor)) {
            $(`#flower_${paper.id}`).addClass('selected_flower');
        }
    }
    $('.coauthor').removeClass('selected_coauthor');
    $(`.coauthor:contains('${selected_coauthor}')`).addClass('selected_coauthor');
}