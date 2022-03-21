// ==UserScript==
// @name         TISS course adder
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Searches TISS for given course names and adds all exact matches to favorites
// @author       You
// @match        https://tiss.tuwien.ac.at/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ac.at
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

// Important: before running script set your desired default/standard favorites category to make sure script adds courses to correct category

const config = {
  // list of courses that should be added to favorites category
  // note: for optimal performance provide course names in same language as the TISS language you are currently using
  courses: [
    'Advanced Database Systems',
    'Data-intensive Computing',
    'Basics of Parallel Computing',
    'Energy-efficient Distributed Systems',
    'Algorithmics',
    'Optimization in Transport and Logistics',
    'Graph Drawing Algorithms',
    'Fixed-Parameter Algorithms and Complexity',
    'Structural Decomposition',
    'Analysis 2',
    'Analysis 2',
    'Approximation Algorithms',
    'Complexity Analysis',
    'Database Theory',
    'Effiziente Programme',
    'GPU Architectures and Computing',
    'High Performance Computing',
    'Heuristic Optimization Techniques',
    'Nonlinear Optimization',
    'Structural Decompositions and Algorithms',
    'Weiterführende Multiprocessor Programmierung',
    'Data-oriented Programming Paradigms',
    'Experiment Design for Data Science',
    'Statistical Computing',
    'Data Acquisition and Survey Methods',
    'Data Stewardship',
    'Advanced Cryptography',
    'Systems and Applications Security',
    'Communicating Data',
    'Data Center Operations',
    'Data Stewardship',
    'Internet Security',
    'Organizational Aspects of IT-Security',
    'Software Security',
    'User Research Methods',
    'User Research Methods',
    'Advanced Methods for Regression and Classification',
    'Machine Learning',
    'Recommender Systems',
    'Statistical Simulation and Computer Intensive Methods',
    'Advanced Learning Methods',
    'Advanced Modeling and Simulation',
    'Applied Deep Learning',
    'AKNUM Reinforcement Learning',
    'Bayesian Statistics',
    'Bayesian Statistics',
    'Business Intelligence',
    'Data Analysis',
    'Crypto Asset Analytics',
    'Deep Learning for Visual Computing',
    'General Regression Models',
    'Introduction to Statistical Inference',
    'Introduction to Statistical Inference',
    'Machine Learning for Visual Computing',
    'Mathematical Programming',
    'Modeling and Simulation',
    'Multivariate Statistics',
    'Multivariate Statistics',
    'Problem Solving and Search in Artificial Intelligence',
    'Self-Organizing Systems',
    'Similarity Modelling 1',
    'Similarity Modelling 2',
    'Social Network Analysis',
    'Cognitive Foundations of Visualization',
    'Information Visualization',
    'Semantic Systems',
    'Design and Evaluation of Visualisations',
    'Advanced Information Retrieval',
    'Deductive Databases',
    'Description Logics and Ontologies',
    'Natural Language Processing and Information Extraction',
    'Information Visualization',
    'KBS for Business Informatics',
    'Knowledge-based Systems',
    'Knowledge Graphs',
    'Medical Image Processing',
    'Medical Image Processing',
    'Processing of Declarative Knowledge',
    'Real-time Visualization',
    'Semantic Web Technologies',
    'Semi-Automatic Information and Knowledge Systems',
    'Visual Data Science',
    'Visualization 2',
  ],
};

(() => {
  window.addEventListener('load', () => {
    // In case you're wondering about the wird logic for detecting when the page has loaded:
    // If I understood correctly, TISS only returns static pages
    // When you load the initial TISS page, TISS always returns a temporary loading page before (with 'loading' class on body)
    // Once TISS has actually loaded properly, the 'loading' class is not present anymore
    const pageLoaded = !document.body.classList.contains('loading');
    if (!pageLoaded) return;

    // variables that have to be stored in between loads of the TamperMonkey script
    const scriptVars = {
      get currIdx() {
        return +(GM_getValue('currIdx') || 0);
      },
      set currIdx(newValue) {
        GM_setValue('currIdx', +newValue);
      },

      get notFoundCourses() {
        return JSON.parse(GM_getValue('notFoundCourses') || '[]');
      },

      set notFoundCourses(newValue) {
        GM_setValue('notFoundCourses', JSON.stringify(newValue));
      },

      get addedCourses() {
        return JSON.parse(GM_getValue('addedCourses') || '[]');
      },

      set addedCourses(newValue) {
        GM_setValue('addedCourses', JSON.stringify(newValue));
      },

      get notAddedCourses() {
        return JSON.parse(GM_getValue('notAddedCourses') || '[]');
      },

      set notAddedCourses(newValue) {
        GM_setValue('notAddedCourses', JSON.stringify(newValue));
      },
    };

    const courses = config.courses.map(c => c.toLowerCase()); //convert all courses to lowercase to make search a bit more flexible
    const isScanInProgress = () => scriptVars.currIdx < courses.length;

    console.log('TISS bookmark adder script loaded');
    console.log(
      `courses processed: ${scriptVars.currIdx + 1}/${courses.length}`
    );

    let currentCourse = courses[scriptVars.currIdx];

    console.log('current course to search:', currentCourse);

    let outputDiv; // div used by script for outputting stuff to user; defined once some kind of output log is created

    if (location.href.includes('favorites')) {
      //we are on favorites page
      const groupPanelContent = document.querySelector(
        '#contentForm\\:groupPanel'
      ).textContent;

      while (
        isScanInProgress() &&
        groupPanelContent.toLowerCase().includes(currentCourse) &&
        //could be that there's e.g. VO and UE with same course name TODO: find better solution
        courses.filter(c => c === currentCourse).length < 2
      ) {
        scriptVars.notAddedCourses = [
          ...scriptVars.notAddedCourses,
          currentCourse,
        ];
        scriptVars.currIdx = scriptVars.currIdx + 1;
        currentCourse = courses[scriptVars.currIdx];
        console.log(
          'previous course already in favorites, next course:',
          currentCourse
        );
      }

      if (isScanInProgress()) {
        const searchField = document.querySelector('#searchForm\\:searchField'); // "fun" fact: ':' needs to be escaped in IDs https://stackoverflow.com/questions/5552462/handling-colon-in-element-id-with-jquery
        const searchButton = document.querySelector(
          '#searchForm\\:submitSearchField'
        );

        if (currentCourse) {
          searchField.value = currentCourse;
          searchButton.click();
        } else {
          console.warn(
            'Scan in progress, but no course found for index',
            scriptVars.currIdx
          );
        }
      } else {
        //add summary
        const notFoundCourses = scriptVars.notFoundCourses;
        outputLog(
          'contentForm\\:groupPanel',
          `Scan of provided course keyword list completed.${
            notFoundCourses.length > 0
              ? '<br><br>' +
                scriptVars.notFoundCourses.length +
                ' courses were not found: <br>'
              : ''
          }${scriptVars.notFoundCourses.join(', ')}`
        );
        outputDiv.appendChild(
          createButton('Restart scan', () => {
            scriptVars.currIdx = 0;
            location.reload();
          })
        );
      }
    } else if (location.href.includes('courseDetails')) {
      const courseHeaderText =
        document.querySelector('#contentInner h1').textContent;
      const subscribeLink = document.querySelector("[id*='subscriptionLink']");
      const courseInFavs = subscribeLink === null;

      if (courseInFavs) {
        console.log(currentCourse, 'already in favorites, skipping...');
        scriptVars.currIdx = scriptVars.currIdx + 1;
        navigateToFavorites(); // navigate back to favorites page
        return;
      } else {
        const courseNameMatching = courseHeaderText
          .toLowerCase()
          .includes(currentCourse);
        if (
          courseNameMatching ||
          confirm(
            'course name"' +
              currentCourse +
              '" not found on this page. Is it just a language mismatch, and we may add anyway?'
          )
        ) {
          scriptVars.addedCourses = [...scriptVars.addedCourses, currentCourse];
          subscribeLink.click(); // add to favorites; will redirect automatically once done
        } else {
          scriptVars.notAddedCourses = [
            ...scriptVars.notAddedCourses,
            currentCourse,
          ];
        }

        scriptVars.currIdx = scriptVars.currIdx + 1;
      }
    } else if (location.href.includes('courseList')) {
      // we get to this page in case of ambiguos search term or if no results were found
      if (isScanInProgress()) {
        if (!document.querySelector('[id*=courseList\\:courseTable]')) {
          // no results!
          scriptVars.notFoundCourses = [
            ...scriptVars.notFoundCourses,
            courses[scriptVars.currIdx],
          ];

          scriptVars.currIdx = scriptVars.currIdx + 1;

          navigateToFavorites(); // navigate back to favorites page
        } else {
          outputLog(
            'courseList\\:courseTable',
            `Search term "${
              courses[scriptVars.currIdx]
            }" is ambiguous, please select desired course, or skip`
          );

          // we handle also scenario that user clicks directly on add to favorites button in table instead of selecting course
          // tried to listen to changes in <a> tags for add to favorites "buttons" and in table
          // doesn't work as after clicking whole content is actually swapped apparently
          // so, just listen for changes to contentInner
          const contentInner = document.querySelector('#contentInner');

          const obs = new MutationObserver(mutationRecords => {
            mutationRecords.forEach(r => {
              const addedNodes = Array.from(r.addedNodes);
              if (addedNodes.some(n => n.id === 'globalMessagesPanel')) {
                // new message panel with notification for successful adding to favorites added (old one is simply removed)
                // at this point we know that we can moved forward
                scriptVars.currIdx = scriptVars.currIdx + 1;
                navigateToFavorites();
              }
            });
          });

          obs.observe(contentInner, { childList: true });

          outputDiv.appendChild(
            createButton('Skip', () => {
              scriptVars.currIdx = scriptVars.currIdx + 1;
              navigateToFavorites();
            })
          );
        }
      }
    }

    function addStyle(CSSText) {
      const style = document.createElement('style');
      style.appendChild(document.createTextNode(CSSText));
      document.querySelector('head').appendChild(style);
    }

    function outputLog(parentId, logText) {
      insertDiv(parentId, `<b>Course adder script:</b> ${logText}`);
    }

    function insertDiv(parentID, innerHTML) {
      const outputDivId = 'TISS-crawler-output';

      addStyle(`
    #${outputDivId} {
      background: #FFFFA7;
      padding: 10px 7px;
      margin-bottom: 10px;
    }`);

      outputDiv = document.createElement('div');
      outputDiv.innerHTML = innerHTML;
      outputDiv.id = outputDivId;

      const parent = document.querySelector(`#${parentID}`);

      parent.insertBefore(outputDiv, parent.firstChild);
    }

    function createButton(label, clickHandler) {
      const button = document.createElement('button');
      button.innerText = label;
      button.addEventListener('click', clickHandler);
      button.style.marginLeft = '10px';
      button.type = 'button'; // this is important! otherwise button submits form per default!
      return button;
    }

    function navigateToFavorites() {
      location.href = 'https://tiss.tuwien.ac.at/education/favorites.xhtml';
    }
  });
})();
