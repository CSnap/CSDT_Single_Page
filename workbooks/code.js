let stepVideo = '.sv';
let stepBlockPreview = 'bp';

let stepCodeBlocks = '.scb .col-md-3';

let constants = {
    rhythmFrame: '#rw',
    csnapFrame: '#csnap-pro',
    backSetClass: "is-prev",
    forwardSetClass: "is-next",
    stepDiv: "stepline",
    stepNumber: '.step_numb',
    stepIconClass: 'gen-icon',
    stepPinClass: "timeline--inner-pin",
    stepPinVideo: "",
    simpleGoalDiv: '#simple-goal',
    detailedGoalDiv: '#detailed-goal',
    hintToggle: '#hint-btn',
    hintDiv: '#hint-div',
    projectVideoDiv: '#svp-div',
    goalMoreInfoBtn: '#more-info',
    videoTextSummary: '#summary',
    nextStepsImage: '#next-steps-img',
    nextStepsSummary: '#reviewText',
    footerStepTitle: '.step-h',
    stepTitle: '.st',
    footerStepSubtitle: '.sh',
    blockDescription: 'block-description',
    blockSelector: 'block-options',
    blockDemoDiv: 'block-demonstration',
    blockTitle: 'block-sum-title',
    blockImage: 'block-sum-img-div',
    blockText: 'block-sum-desc',
    progressBar: '.progress-bar',
    backgroundLink: "#reviewBackground",
    softwareLink: "#reviewSoftware"

}

let stepTypes = {
    video: '_video',
    project: '_project',
    blockSummary: '_summary',
    nextSteps: "_review"
}

let textStates = {
    goalMore: 'More Info...',
    goalLess: 'Less Info...',
    hintEnter: '<strong>Need a Hint?</strong> Click here to view the solution.',
    hintExit: 'Click here to rewatch the lesson.'
}

let curriculumData = {
    length: ['Session', 'Week', 'Semester'],
    type: ['Computer Science', 'Mathematics']
}

let curriculumConstants = {
    header: '.curriculum-type',
    subheader: '.curriculum-length',
    loadingScreen: '.loading-overlay'
}

var Tutorial, Step, Workbook;

function Tutorial(str, bg, software) {
    this.init(str, bg, software);
}

Tutorial.prototype.init = function (str, backgroundSection, softwareSection) {
    this.data = {};
    this.tut = $(constants.footerStepSubtitle).html();
    this.steps = -1;
    this.types = [];
    this.titles = [];
    this.categories = [];
    this.videos = [];
    this.projects = [];
    this.blocks = [];
    this.detailedGoals = [];
    this.simpleGoals = [];
    this.hints = [];
    this.posters = [];
    this.mediaBase = str;
    this.uniqueCategories = [];
    this.currentStep = -1;
    this.currentCategory = '';
    this.finished = 0;
    this.playerProject = new Plyr(document.getElementById('sv-project'));
    this.playerVideo = new Plyr(document.getElementById('sv-video'));
    this.playerHint = new Plyr(document.getElementById('hint'));
    this.playerDemo = new Plyr(document.getElementById('block-demo'));
    this.loadBase = false;
    this.base = "";




    this.nextStepLinks = {
        background: backgroundSection,
        software: softwareSection
    }




    let myself = this;

    // Checks for data.json file (should contain all data on the tutorial)
    $.ajax({
        type: 'GET',
        url: str + 'data.json',
        dataType: 'json',
        async: false,
        success: function (data) {
            myself.data = data;
        }
    });

    // Checks for base.xml (this is the main tutorial to load, if you have additional functionality for the tut.)
    $.ajax({
        type: 'GET',
        url: str + 'base.xml',
        dataType: 'xml',
        async: false,
        success: function (data) {
            myself.base = str + 'base.xml';
            myself.loadBase = true;
        }
    });

    // Grabs all the information from the data.json and stores into arrays
    try {
        Object.keys(myself.data).some(function (name) {
            myself.types.push(name);
            myself.titles.push(myself.data[name].title == "" ? "Step" : myself.data[name].title);
            myself.categories.push(myself.data[name].category);
            myself.videos.push(myself.data[name].video == "" ? null : myself.data[name].video);
            myself.projects.push(myself.data[name].project == "" ? null : myself.data[name].project);
            myself.blocks.push(myself.data[name].blocks.length == 0 ? null : myself.data[name].blocks);
            myself.detailedGoals.push(myself.data[name].detailedGoal == "" ? null : myself.data[name].detailedGoal);
            myself.simpleGoals.push(myself.data[name].simpleGoal == "" ? null : myself.data[name].simpleGoal);
            myself.hints.push(myself.data[name].hint == "" ? null : myself.data[name].hint);
            myself.posters.push(myself.data[name].poster == "" ? null : myself.data[name].poster);
            myself.steps++;
        });

        myself.uniqueCategories = [...new Set(myself.categories)];
        myself.currentCategory = myself.uniqueCategories[0];


    } catch (error) {
        console.log('Something Went Wrong...')
    }

    // Creates the step navigation
    this.createPrevSetButton();
    this.createStepButtons();
    this.createNextSetButton();

    this.queryString = window.location.search;
    this.urlParams = new URLSearchParams(this.queryString);



    if (this.urlParams != '') {
        let id = this.urlParams.get('id');
        try {
            this.loadStep(id);
        } catch (e) {
            // alert("That is not valid...");
            this.loadStep(0);
        }

    } else {
        this.loadStep(0);
    }


    $('.prev').bind('click', function () {
        myself.prevStep();
    });
    $('.next').bind('click', function (e) {
        myself.nextStep();
    });


    $(constants.goalMoreInfoBtn).bind('click', function () {
        $(constants.simpleGoalDiv).attr('hidden', !$(constants.simpleGoalDiv).attr('hidden'));
        $(constants.detailedGoalDiv).attr('hidden', !$(constants.detailedGoalDiv).attr('hidden'));
        $(constants.goalMoreInfoBtn).html(!$(constants.simpleGoalDiv).attr('hidden') ? textStates.goalMore : textStates.goalLess);
    });

    $(constants.hintToggle).bind('click', function () {
        $(constants.projectVideoDiv).attr('hidden', !$(constants.projectVideoDiv).attr('hidden'));
        $(constants.hintDiv).attr('hidden', !$(constants.hintDiv).attr('hidden'));
        $(constants.hintToggle).html($(constants.hintDiv).attr('hidden') ? textStates.hintEnter : textStates.hintExit);
    });

};

Tutorial.prototype.loadStep = function (num) {

    let projectXML;

    // Remove active status on current step
    $(`#btn-${this.currentStep}`).removeClass("active");

    //Set current step to selected number
    this.currentStep = num;

    // Add active status on current step
    $(`#btn-${num}`).addClass("active");

    // Switch video source for video step
    this.playerVideo.source = {
        type: 'video',
        sources: [{
            src: this.mediaBase + this.videos[num],
            type: 'video/mp4',
        }],
        poster: this.posters[num],
    }

    // Switch video source for project step
    if (this.types[num].includes(stepTypes.project)) {
        this.playerProject.source = {
            type: 'video',
            sources: [{
                src: this.mediaBase + this.videos[num],
                type: 'video/mp4',
            }],
            poster: this.posters[num],
        };
    }

    //Switch video source for hint in project step
    if (this.hints[num] !== null) {
        this.playerHint.source = {
            type: 'video',
            sources: [{
                src: this.mediaBase + this.hints[num],
                type: 'video/mp4',
            }]
        };
    }

    if (!$(`.${constants.stepPinClass}[data-title="${num + 1}"]`).hasClass('is-active')) {
        $(`.${constants.stepPinClass}`).removeClass('is-active');
    }

    // Update the progress bar based on step
    this.updateCodeProgress();
    if (!$(`.${constants.stepPinClass}[data-title="${num + 1}"]`).hasClass('was-viewed')) {
        $(`.${constants.stepPinClass}[data-title="${num + 1}"]`).addClass('was-viewed');
        if (this.types[num].includes(stepTypes.project)) {
            this.finished = this.finished + 1;
        } else if (this.types[num].includes(stepTypes.blockSummary)) {
            this.finished = this.finished + 1;
            this.updateCodeProgress();
        } else if (this.types[num].includes(stepTypes.nextSteps)) {
            this.finished = this.finished + 1;
            this.updateCodeProgress();
        }
    }

    // Update text in footer title (left hand side of the footer)
    $(constants.footerStepTitle).html(' (' + (this.currentStep + 1) + '/' + (this.steps + 1) + ')');

    //Update the step number text
    $(constants.stepNumber).html(num + 1);


    $(`.${constants.stepPinClass}[data-title="${num + 1}"]`).addClass('is-active');


    // Check to see type of project (rhythm wheels, csnap, or other)
    if (this.projects[num] === "rhythm_wheels") {
        $(constants.rhythmFrame).attr('hidden', false);
        $(constants.csnapFrame).attr('hidden', true);

    } else {
        $(constants.rhythmFrame).attr('hidden', true);
        $(constants.csnapFrame).attr('hidden', false);

        if (this.types[num].includes(stepTypes.project)) {
            // Load in xml for csnap step
            fetch(this.loadBase ? this.base : this.projects[num])
                .then(response => response.text())
                .then(data => {
                    projectXML = data;
                    try {
                        let iframe = document.querySelector('iframe');
                        let world = iframe.contentWindow.world;
                        let ide = world.children[0];

                        ide.loadTutorial(data);
                        this.loadBase = false;

                    } catch (e) {
                        console.log(e);
                    }
                });
        }

    }


    // Resets per step
    $(constants.hintToggle).html(textStates.hintEnter);
    $(constants.goalMoreInfoBtn).html(textStates.goalMore);
    $(constants.projectVideoDiv).attr('hidden', false);
    $(constants.hintDiv).attr('hidden', true);

    $(`#${constants.blockSelector}`).html('');
    $(`#${constants.blockDescription}`).html('');
    $(`#${constants.blockDemoDiv}`).html('');


    // Establish the view for current step
    if (this.types[num].includes(stepTypes.video)) {

        this.setStepState('video');

        // Written information for video step
        $(constants.videoTextSummary).html(this.detailedGoals[num]);

    } else if (this.types[num].includes(stepTypes.project)) {

        this.setStepState('project');

        // Text Goals
        $(constants.simpleGoalDiv).html(this.simpleGoals[num]);
        $(constants.simpleGoalDiv).attr('hidden', false);

        $(constants.detailedGoalDiv).html(this.detailedGoals[num]);
        $(constants.detailedGoalDiv).attr('hidden', true);

    } else if (this.types[num].includes(stepTypes.blockSummary)) {

        this.setStepState('blockSummary');

        // Create the blocks for that summary
        if (this.blocks[num] !== null) {
            this.createBlockSummaryBlocks(num);
        }

    } else {

        this.setStepState('nextSteps');

        // For the 'next steps' step, add final text and image
        $(constants.nextStepsImage).attr('src', this.posters[num]);
        $(constants.nextStepsSummary).html(this.detailedGoals[num]);

        // Next step links
        console.log(this.nextStepLinks.background);
        console.log(this.nextStepLinks.software)
        $(constants.backgroundLink).attr('href', this.nextStepLinks.background);
        $(constants.softwareLink).attr('href', this.nextStepLinks.software);

    }

    // Update the title
    $(constants.stepTitle).html(this.titles[num]);

    //Update the footer subtitle (the right hand side of the footer)
    $(constants.footerStepSubtitle).html(this.categories[num] + ' --- ' + this.tut);

}

Tutorial.prototype.loadBlock = function (block, cur) {
    let currentBlock = eval(`${block}`);

    if (!cur.classList.contains('block-active')) {
        $(`.block-sum `).removeClass('block-active');
    }

    $(`#${constants.blockDescription} .${constants.blockTitle}`).html(currentBlock.title);
    $(`#${constants.blockDescription} .${constants.blockImage} img`).attr('src', );
    $(`#${constants.blockDescription} .${constants.blockText}`).html(currentBlock.des);

    this.playerDemo.source = {
        type: 'video',
        sources: [{
            src: currentBlock.vid,
            type: 'video/mp4',
        }]
    }

    cur.classList.add('block-active');
}

Tutorial.prototype.prevStep = function () {
    if (this.currentStep == 0) {
        console.log('No more steps');
    } else {
        let num = this.currentStep - 1;
        if ($(`.${constants.stepPinClass}[data-title="${num - 1}"]`).attr('hidden')) {
            this.loadPrevSet(num);
        } else {
            this.loadStep(num);
        }
    }
}

Tutorial.prototype.nextStep = function () {
    if ((this.currentStep) == this.steps) {
        console.log('No more steps');
    } else {

        let num = this.currentStep + 1;
        if ($(`.${constants.stepPinClass}[data-title="${num + 1}"]`).attr('hidden')) {
            this.loadNextSet(num);
        } else {
            this.loadStep(num);
        }
    }
}

Tutorial.prototype.loadNextSet = function (num) {
    let lastElement = this.uniqueCategories[this.uniqueCategories.length - 1];
    let curIndex = this.uniqueCategories.indexOf(this.currentCategory);

    if (this.currentCategory === lastElement) {
        console.log("No more sets available");
    } else {
        $(`.${constants.stepPinClass}[data-step-set="${this.currentCategory}"]`).attr('hidden', true);

        curIndex++;
        this.currentCategory = this.uniqueCategories[curIndex];

        $(`.${constants.stepPinClass}[data-step-set="${this.currentCategory}"]`).attr('hidden', false);

        for (let i = 0; i < this.steps; i++) {
            $(`${constants.stepNumber}`).removeClass(`txt-${i}`);
        }
        $(`${constants.stepNumber}`).addClass(`txt-${this.uniqueCategories.indexOf(this.currentCategory)}`);

        if (num) {
            this.loadStep(num);
        } else {
            this.loadStep($(`.${constants.stepPinClass}[data-step-set="${this.currentCategory}"]`).first().attr('data-title') - 1);
        }
    }
}

Tutorial.prototype.loadPrevSet = function (num) {
    let firstElement = this.uniqueCategories[0];
    let curIndex = this.uniqueCategories.indexOf(this.currentCategory);

    if (this.currentCategory === firstElement) {
        console.log("No more sets available");
    } else {
        $(`.${constants.stepPinClass}[data-step-set="${this.currentCategory}"]`).attr('hidden', true);
        curIndex--;
        this.currentCategory = this.uniqueCategories[curIndex];

        $(`.${constants.stepPinClass}[data-step-set="${this.currentCategory}"]`).attr('hidden', false);
        for (let i = 0; i < this.steps; i++) {
            $(`${constants.stepNumber}`).removeClass(`txt-${i}`);
        }
        $(`${constants.stepNumber}`).addClass(`txt-${this.uniqueCategories.indexOf(this.currentCategory)}`);

        if (num) {
            this.loadStep(num);
        } else {
            this.loadStep($(`.${constants.stepPinClass}[data-step-set="${this.currentCategory}"]`).first().attr('data-title') - 1);
        }

    }
}

Tutorial.prototype.createPrevSetButton = function () {
    let myself = this;

    if (this.uniqueCategories.length > 1) {

        let prevBtn = document.createElement("I");
        let prevBtnIcon = document.createElement("I");

        prevBtn.classList.add(constants.stepPinClass, constants.backSetClass);
        prevBtnIcon.classList.add('fas', 'fa-angle-double-left', constants.stepIconClass);

        prevBtn.setAttribute('data-title', '');
        prevBtn.setAttribute('data-header', 'Prev Section');

        prevBtn.appendChild(prevBtnIcon);

        document.getElementById(constants.stepDiv).appendChild(prevBtn);

        prevBtn.addEventListener('click', () => {
            myself.loadPrevSet();
        });
    }
}

Tutorial.prototype.createNextSetButton = function () {
    let myself = this;

    if (this.uniqueCategories.length > 1) {

        let nextBtn = document.createElement("I");
        let nextBtnIcon = document.createElement("I");

        nextBtn.classList.add(constants.stepPinClass, constants.forwardSetClass);
        nextBtnIcon.classList.add('fas', 'fa-angle-double-right', constants.stepIconClass);

        nextBtn.setAttribute('data-title', '');
        nextBtn.setAttribute('data-header', 'Next Section');

        nextBtn.appendChild(nextBtnIcon);

        document.getElementById(constants.stepDiv).appendChild(nextBtn);

        nextBtn.addEventListener('click', () => {
            myself.loadNextSet();
        });
    }
}

Tutorial.prototype.createStepButtons = function () {
    let myself = this;

    for (let i = 0; i <= this.steps; i++) {

        let btn = document.createElement("I");
        let icon = document.createElement("I");

        btn.setAttribute("data-title", i + 1);
        btn.setAttribute("data-header", this.titles[i]);
        btn.setAttribute("data-step-set", this.categories[i]);

        if (myself.types[i].includes(stepTypes.video)) {
            btn.classList.add(constants.stepPinClass);
            icon.classList.add('fas', 'fa-video', constants.stepIconClass);
            btn.appendChild(icon);
        } else if (myself.types[i].includes(stepTypes.project)) {
            btn.classList.add(constants.stepPinClass);
            icon.classList.add('fas', 'fa-file-code', constants.stepIconClass);
            btn.appendChild(icon);
        } else if (myself.types[i].includes(stepTypes.blockSummary)) {
            btn.classList.add(constants.stepPinClass);
            icon.classList.add('fas', 'fa-list', constants.stepIconClass);
            btn.appendChild(icon);
        } else {
            btn.classList.add(constants.stepPinClass);
            icon.classList.add('fas', 'fa-award', constants.stepIconClass);
            btn.appendChild(icon);
        }

        document.getElementById(constants.stepDiv).appendChild(btn);
        btn.addEventListener('click', () => {
            myself.loadStep(i);
        });

        if (this.categories[i] != this.currentCategory) {
            btn.setAttribute('hidden', true);
        }

    };

}

Tutorial.prototype.createBlockSummaryBlocks = function (num) {
    let myself = this;


    let currBlock = eval(`${this.blocks[num][0]}`);

    this.playerDemo.source = {
        type: 'video',
        sources: [{
            src: currBlock.vid,
            type: 'video/mp4',
        }]
    }

    for (let i = 0; i < this.blocks[num].length; i++) {
        let block = eval(`${this.blocks[num][i]}`);

        let blockDiv = document.createElement("DIV");

        let imgDiv = document.createElement("DIV");
        let imgTitle = document.createElement("P");
        let imgVideo = document.createElement("VIDEO");
        let imgGif = document.createElement("IMG");
        let imgHr = document.createElement("HR");
        let img = document.createElement("IMG");

        let imgDes = document.createElement("P");

        blockDiv.classList.add('light-grey-box', 'block-sum', 'mx-auto', 'mb-3');
        imgDiv.classList.add(constants.blockImage, 'text-center');
        imgTitle.classList.add(constants.blockTitle);
        imgGif.classList.add('img-fluid', 'rounded');
        imgDes.classList.add(constants.blockText, 'text-muted');


        imgTitle.innerHTML = block.title;
        imgGif.setAttribute("src", block.exp);
        imgVideo.src = block.vid;
        img.setAttribute("src", block.block);
        imgDes.innerHTML = block.des;

        imgDiv.appendChild(img);
        blockDiv.appendChild(imgTitle);
        blockDiv.appendChild(imgDiv);

        if (i === 0) {
            blockDiv.classList.add('block-active');
            document.getElementById(constants.blockDescription).appendChild(imgTitle.cloneNode(true));
            document.getElementById(constants.blockDescription).appendChild(imgHr.cloneNode(true));
            document.getElementById(constants.blockDescription).appendChild(imgDiv.cloneNode(true));
            document.getElementById(constants.blockDescription).appendChild(imgDes.cloneNode(true));
        }

        document.getElementById(constants.blockSelector).appendChild(blockDiv);
        blockDiv.addEventListener('click', () => {
            this.loadBlock(this.blocks[num][i], blockDiv);

        });
    }
}

Tutorial.prototype.setStepState = function (step) {

    if (step === 'video') {
        $('.videoSlide').attr('hidden', false);
        $('.summarySlide').attr('hidden', true);
        $('.projectSlide').attr('hidden', true);
        $('.reviewSlide').attr('hidden', true);

    } else if (step === 'project') {
        $('.projectSlide').attr('hidden', false);
        $('.videoSlide').attr('hidden', true);
        $('.summarySlide').attr('hidden', true);
        $('.reviewSlide').attr('hidden', true);

    } else if (step === 'blockSummary') {
        $('.summarySlide').attr('hidden', false);
        $('.videoSlide').attr('hidden', true);
        $('.projectSlide').attr('hidden', true);
        $('.reviewSlide').attr('hidden', true);

    } else {
        $('.reviewSlide').attr('hidden', false);
        $('.videoSlide').attr('hidden', true);
        $('.summarySlide').attr('hidden', true);
        $('.projectSlide').attr('hidden', true);
    }
}

Tutorial.prototype.toString = function () {
    console.log(this.steps);
    console.log(this.titles);
    console.log(this.videos);
    console.log(this.projects);
    console.log(this.blocks);
    console.log(this.detailedGoals);
    console.log(this.simpleGoals);
}

Tutorial.prototype.selectStep = function (num) {

    $(`.${constants.stepPinClass}[data-step-set="${this.currentCategory}"]`).attr('hidden', true);
    this.currentCategory = this.categories[num];
    for (let i = 0; i < this.steps; i++) {
        $(`${constants.stepNumber}`).removeClass(`txt-${i}`);
    }
    $(`${constants.stepNumber}`).addClass(`txt-${this.uniqueCategories.indexOf(this.currentCategory)}`);
    $(`.${constants.stepPinClass}[data-step-set="${this.currentCategory}"]`).attr('hidden', false);
    this.loadStep(num);
}

Tutorial.prototype.updateVideoProgress = function (myself) {
    this.finished = this.finished + 1;
    $(constants.progressBar).attr('aria-valuenow', parseInt(this.finished / this.steps) * 100);
    $(constants.progressBar).css('width', parseInt((this.finished / this.steps) * 100) + '%');
    $(constants.progressBar).html(parseInt((this.finished / this.steps) * 100) + '% Complete');
}

Tutorial.prototype.updateCodeProgress = function () {
    $(constants.progressBar).attr('aria-valuenow', parseInt(this.finished / this.steps) * 100);
    $(constants.progressBar).css('width', parseInt((this.finished / this.steps) * 100) + '%');
    $(constants.progressBar).html(parseInt((this.finished / this.steps) * 100) + '% Complete');
}


function introModal(btn) {

    if (btn == 'video') {
        $('.modal-video-tab').attr('hidden', false);
        $('.modal-summary-tab').attr('hidden', true);

        if ($('#modal-summary-link').hasClass('active')) {
            $('#modal-summary-link').removeClass('active');
        }

        if ($('#modal-video-link').hasClass('active')) {

        } else {
            $('#modal-video-link').addClass('active');
        }

    } else {
        $('.modal-video-tab').attr('hidden', true);
        $('.modal-summary-tab').attr('hidden', false);
        if ($('#modal-video-link').hasClass('active')) {
            $('#modal-video-link').removeClass('active');
        }

        if ($('#modal-summary-link').hasClass('active')) {

        } else {
            $('#modal-summary-link').addClass('active');
        }
    }

    $('.modal-video-tab').attr('hidden') ? $('#modal-video-link').removeClass('active') : $('#modal-video-link').addClass('active');
}



function Workbook(str, bg, software) {
    this.init(str, bg, software);
}

Workbook.prototype.init = function (type, location, currentLesson = 0) {
    // workbook
    this.workbookData = {};
    this.workbookTitles = [];
    this.workbookSection = [];
    this.workbookDetails = [];
    this.workbookProjects = [];
    this.workbookChallenges = [];
    this.workbookSoftware = [];
    this.workbookTutorials = [];

    let myself = this;

    // Checks for data.json file (should contain all data on the tutorial)
    $.ajax({
        type: 'GET',
        url: str + 'data.json',
        dataType: 'json',
        async: false,
        success: function (data) {
            myself.data = data;
        }
    });


};

Workbook.prototype.getChallenges = function (tags) {


}


function Curriculum(type, length) {
    this.init(type, length);
}

Curriculum.prototype.init = function (type, length) {
    let myself = this;

    this.type = curriculumData.type[type];
    this.length = curriculumData.length[length];
    this.homepageData = this.type === "Computer Science" ? './computerscience/data.json' : './';
    this.data = {};
    this.titles = [];

    // Checks for data.json file (should contain all data on the tutorial)
    $.ajax({
        type: 'GET',
        url: this.homepageData,
        dataType: 'json',
        async: false,
        success: function (data) {
            myself.data = data;
        }
    });

    try {
        Object.keys(myself.data).some(function (name) {
            myself.titles.push(myself.data[name].title);
        });

        console.log(myself.titles);
    } catch (error) {
        console.log('Something Went Wrong...')
    }

    this.updateContent();


}

Curriculum.prototype.updateContent = function () {
    $(curriculumConstants.header).html(this.type);
    $(curriculumConstants.subheader).html(`One ${this.length} Curriculum`);

    setTimeout(function () {
        $(curriculumConstants.loadingScreen).attr('hidden', true);
    }, 3000);
    

}