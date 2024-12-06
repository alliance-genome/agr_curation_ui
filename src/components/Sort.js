import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import {
    sortButtonModsQuery,
    removeReferenceFromSortLive,
    changeSortCorpusToggler,
    changeSortWorkflowToggler,
    updateButtonSort,
    closeSortUpdateAlert,
    setSortUpdating,
} from '../actions/sortActions';
import { setReferenceCurie, setGetReferenceCurieFlag, getCuratorSourceId } from '../actions/biblioActions';
import { Spinner, Form, Container, Row, Col, Button, Alert } from 'react-bootstrap';
import "react-bootstrap-typeahead/css/Typeahead.css";
import axios from "axios";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import ReferencesToSort from './ReferencesToSort'; 
import { AlertAteamApiDown } from "./ATeamAlert"; 
import PropTypes from 'prop-types';

const RowDivider = () => { return (<Row><Col>&nbsp;</Col></Row>); }

const Sort = () => {
  // Selectors
  const referencesToSortLive = useSelector(state => state.sort.referencesToSortLive);
  const accessToken = useSelector(state => state.isLogged.accessToken);
  const sortType = useSelector(state => state.sort.sortType);
  const sortUpdating = useSelector(state => state.sort.sortUpdating);
  const getPapersToSortFlag = useSelector(state => state.sort.getPapersToSortFlag);
  const isLoading = useSelector(state => state.sort.isLoading);
  const oktaMod = useSelector(state => state.isLogged.oktaMod);
  const testerMod = useSelector(state => state.isLogged.testerMod);
  const uid = useSelector(state => state.isLogged.uid);
  const userId = useSelector(state => state.isLogged.userId);

  // Selectors for claim papers
  const claimingPapers = useSelector(state => state.sort.claimingPapers);
  const claimPapersError = useSelector(state => state.sort.claimPapersError);

  const dispatch = useDispatch();

  const [speciesSelectLoading, setSpeciesSelectLoading] = useState([]);
  const speciesTypeaheadRef = useRef(null);
  const [speciesSelect, setSpeciesSelect] = useState([]);
  const [typeaheadOptions, setTypeaheadOptions] = useState([]);
  const [topicEntitySourceId, setTopicEntitySourceId] = useState(undefined);

  const [viewMode, setViewMode] = useState('Sort'); // 'Sort', 'Prepublication', or 'Recently sorted'
  const [selectedCurator, setSelectedCurator] = useState('unclaimed'); // Default to 'unclaimed'
  const [selectedTimeframe, setSelectedTimeframe] = useState('1');
  const [curatorOptions, setCuratorOptions] = useState([]);
  const [recentlySortedData, setRecentlySortedData] = useState([]);
  const [showInsidePapers, setShowInsidePapers] = useState(true);

  let accessLevel = testerMod !== 'No' ? testerMod : oktaMod;
  let activeMod = accessLevel;

  useEffect(() => {
    const fetchSourceId = async () => {
      if (accessToken !== null) {
        const sourceId = await getCuratorSourceId(accessLevel, accessToken);
        setTopicEntitySourceId(sourceId);
      }
    }
    fetchSourceId().catch(console.error);
  }, [accessLevel, accessToken]);

  let buttonUpdateDisabled = sortUpdating > 0;

  useEffect(() => {
    let mappedSortType = null;
    if (viewMode === 'Sort') {
      mappedSortType = 'needs_review';
    } else if (viewMode === 'Prepublication') {
      mappedSortType = 'prepublication_pipeline';
    } else {
      return;
    }

    if (mappedSortType && sortUpdating === 0 && accessLevel) {
      console.log(`Dispatching sortButtonModsQuery with mod: ${accessLevel}, sortType: ${mappedSortType}`);
      dispatch(sortButtonModsQuery(accessLevel, mappedSortType));
    }
  }, [viewMode, sortUpdating, accessLevel, dispatch]);

  // Fetch recently sorted papers and curator options when viewMode changes to 'Recently sorted'
  useEffect(() => {
    if (viewMode === 'Recently sorted' && accessToken && accessLevel) {    
      fetchRecentlySortedPapers(accessLevel, selectedTimeframe, selectedCurator);
      setShowInsidePapers(true); 
    }
  }, [viewMode, accessToken, accessLevel, selectedTimeframe, selectedCurator]);

  const fetchRecentlySortedPapers = async (modAbbreviation, day, curatorUid) => {
    const url = `${process.env.REACT_APP_RESTAPI}/sort/recently_sorted?mod_abbreviation=${encodeURIComponent(modAbbreviation)}&day=${encodeURIComponent(day)}&curator=${encodeURIComponent(curatorUid)}`;

    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Network response was not ok: ${res.statusText}`);
      }

      const data = await res.json();
      const { curator_data, data: references } = data;

      let curators = Object.entries(curator_data).map(([email, uid]) => ({ email, uid }));
      const loggedInUserUid = uid;
      const loggedInUserIncluded = curators.some(curator => curator.uid === loggedInUserUid);

      if (loggedInUserIncluded) {
        const index = curators.findIndex(curator => curator.uid === loggedInUserUid);
        if (index > 0) {
          const [loggedInUser] = curators.splice(index, 1);
          curators.unshift(loggedInUser);
        }
      }

      setCuratorOptions(curators);
      setRecentlySortedData(references);

      if (!curators.some(curator => curator.uid === selectedCurator) && references.some(ref => ref.claimed_by === null)) {
        setSelectedCurator('unclaimed');
      }
    } catch (error) {
      console.error('Error fetching recently sorted papers:', error);
    }
  };

  // Handler for 'Find sorted papers' button
  const handleFindSortedPapers = () => {
    let curator = selectedCurator;
    console.log(`Selected Curator Before Check: ${curator}`);
    if (curator === null || curator === undefined) {
      curator = 'unclaimed';
      console.log("Reset curator to 'unclaimed':", curator);
      setSelectedCurator('unclaimed'); // Update state for future use
    }
    console.log(`Fetching papers with curator: ${curator}`);
    fetchRecentlySortedPapers(accessLevel, selectedTimeframe, curator);
  }

  // Function to update sorting
  function updateSorting() {
    const forApiArray = []
    for (const [index, reference] of referencesToSortLive.entries()) {
      if (reference['mod_corpus_association_corpus'] !== null) {
        let updateJson = { 'corpus': reference['mod_corpus_association_corpus'], 'mod_corpus_sort_source': 'manual_creation' }
        let subPath = `reference/mod_corpus_association/${reference['mod_corpus_association_id']}`;
        const field = null;
        const subField = null;
        let method = 'PATCH';
        let array = [accessToken, subPath, updateJson, method, index, field, subField]
        forApiArray.push(array);
        if (reference['mod_corpus_association_corpus'] === true && activeMod === "WB") {
          let reference_type = null;
          if (reference['workflow'] === 'experimental') { reference_type = 'Experimental'; }
          else if (reference['workflow'] === 'not_experimental') { reference_type = 'Not_experimental'; }
          else if (reference['workflow'] === 'meeting') { reference_type = 'Meeting_abstract'; }
          if (reference_type !== null) {
            updateJson = { 'reference_type': reference_type, 'mod_abbreviation': activeMod, 'reference_curie': reference['curie'] }
            subPath = 'reference/mod_reference_type/';
            method = 'POST';
            array = [accessToken, subPath, updateJson, method, index, field, subField]
            forApiArray.push(array);
            if (speciesSelect && speciesSelect[index]) {
              for (const item of speciesSelect[index].values()) {
                const taxArray = item.split(" ");
                updateJson = {
                  'reference_curie': reference['curie'],
                  'entity': taxArray.pop(),
                  'topic': "ATP:0000123",
                  'entity_type': "ATP:0000123",
                  'entity_id_validation': "alliance",
                  'topic_entity_tag_source_id': topicEntitySourceId
                };
                subPath = 'topic_entity_tag/';
                const field = null;
                const subField = null;
                method = 'POST';
                array = [accessToken, subPath, updateJson, method, index, field, subField]
                forApiArray.push(array);
              }
            }
          }
        }
      }
    }

    setSpeciesSelect([]);
    setTypeaheadOptions([]);
    setSpeciesSelectLoading([]);
    if (speciesTypeaheadRef.current) {
      speciesTypeaheadRef.current.clear();
    }

    let dispatchCount = forApiArray.length;

    console.log('dispatchCount ' + dispatchCount)
    dispatch(setSortUpdating(dispatchCount))

    for (const arrayData of forApiArray) {
      dispatch(updateButtonSort(arrayData))
    }
  }

  // Handler for 'Claim Papers' button
  const handleClaimPapers = async () => {
    if (!userId) {
      console.error('User ID is missing. Cannot claim papers.');
      return;
    }
    try {
      // Dispatch the claim action
      await dispatch(sortButtonModsQuery(accessLevel, 'needs_review', userId, 'claim'));
      
      // Fetch the updated list of claimed papers
      await dispatch(sortButtonModsQuery(accessLevel, 'needs_review', userId, null));
      
      // Set the selectedCurator to userId to display user's claimed papers
      setSelectedCurator(userId);
      
    } catch (error) {
      console.error('Error claiming papers:', error);
    }
  }

  // Handler for 'Unclaim Papers' button
  const handleUnclaimPapers = async () => {
    if (!userId) {
      console.error('User ID is missing. Cannot unclaim papers.');
      return;
    }
    try {
      // Dispatch the unclaim action
      await dispatch(sortButtonModsQuery(accessLevel, 'needs_review', userId, 'unclaim'));
      
      // Fetch the updated list of unclaimed papers
      await dispatch(sortButtonModsQuery(accessLevel, 'needs_review', 'unclaimed', null));
      
      // Set the selectedCurator to 'unclaimed' to display unclaimed papers
      setSelectedCurator('unclaimed');
      
    } catch (error) {
      console.error('Error unclaiming papers:', error);
    }
  }

  // Extract unique claimer IDs from referencesToSortLive
  const getUniqueClaimers = () => {
    if (!referencesToSortLive) return [];

    const claimersSet = new Set();
    referencesToSortLive.forEach(ref => {
      if (ref.claimed_by) {
        claimersSet.add(ref.claimed_by);
      }
    });

    let claimers = Array.from(claimersSet);

    // If userId is in the claimers, move them to the top
    if (userId && claimers.includes(userId)) {
      claimers = [userId, ...claimers.filter(claimer => claimer !== userId)];
    }
    return claimers;
  };

  // Determine if the current user has already claimed any papers
  const hasUserClaimed = () => {
    if (!referencesToSortLive) return false;
    return referencesToSortLive.some(ref => ref.claimed_by === userId);
  }

  // Filter papers based on selected curator
  const filteredPapers = () => {
    if (!referencesToSortLive) return [];
    if (selectedCurator === 'unclaimed') {
      return referencesToSortLive.filter(ref => ref.claimed_by === null);
    } else {
      return referencesToSortLive.filter(ref => ref.claimed_by === selectedCurator);
    }
  }

  return (
    <div>
      <h3>References for {accessLevel}</h3>
      <Form>
        <Form.Check
          inline
          type='radio'
          name='viewMode'
          id='viewModeSort'
        >
          <Form.Check.Input
            type='radio'
            name='viewMode'
            id='viewModeSort'
            checked={viewMode === 'Sort'}
            onChange={() => setViewMode('Sort')}
          />
          <Form.Check.Label style={{ fontSize: '1.1em' }}>Sort</Form.Check.Label>
        </Form.Check>

        {/* Conditionally render 'Prepublication' radio button if activeMod is 'WB' */}
        {activeMod === 'WB' && (
          <Form.Check
            inline
            type='radio'
            name='viewMode'
            id='viewModePrepublication'
          >
            <Form.Check.Input
              type='radio'
              name='viewMode'
              id='viewModePrepublication'
              checked={viewMode === 'Prepublication'}
              onChange={() => setViewMode('Prepublication')}
            />
            <Form.Check.Label style={{ fontSize: '1.1em' }}>Prepublication</Form.Check.Label>
          </Form.Check>
        )}

        <Form.Check
          inline
          type='radio'
          name='viewMode'
          id='viewModeRecentlySorted'
        >
          <Form.Check.Input
            type='radio'
            name='viewMode'
            id='viewModeRecentlySorted'
            checked={viewMode === 'Recently sorted'}
            onChange={() => setViewMode('Recently sorted')}
          />
          <Form.Check.Label style={{ fontSize: '1.1em' }}>Recently sorted</Form.Check.Label>
        </Form.Check>
      </Form>
      <Container fluid>
        { (viewMode === 'Sort' || viewMode === 'Prepublication') &&
          <>
            <RowDivider />
            {referencesToSortLive && referencesToSortLive.length > 0 &&
              <>
                <Row>

  <Col lg={3} md={4} sm={6} className="mx-auto"> {/* Center the column and set responsive widths */}
    {/* Dropdown for selecting claimer */}
    {getUniqueClaimers().length > 0 && (
      <Form.Group controlId="formClaimerSelect" className="mb-3">
        <Form.Label style={{ fontWeight: 'bold' }}>Show Papers Claimed By:</Form.Label>
        <Form.Control
          as="select"
          value={selectedCurator}
          onChange={(e) => setSelectedCurator(e.target.value)}
          style={{ width: '100%' }} // Make the select take full width of the column
        >
          {getUniqueClaimers().map((claimer, index) => (
            <option key={index} value={claimer}>
              {claimer}
            </option>
          ))}
          <option value="unclaimed">Unclaimed Papers</option> 
        </Form.Control>
      </Form.Group>
    )}
  </Col>

		      
                </Row>
                <Row>
                  <Col lg={12} className="d-flex justify-content-center align-items-center">
                    {/* "Update Sorting" and "Claim/Unclaim Papers" Buttons */}
                    <SortSubmitUpdateRouter />
                    <Button
                      as="input"
                      style={{ backgroundColor: '#6b9ef3', color: 'white', border: 'none', width: '200px', marginRight: '10px' }} // Set width and margin
                      type="button"
                      disabled={buttonUpdateDisabled}
                      value="Update Sorting"
                      onClick={() => updateSorting()}
                    />{' '}
                    {hasUserClaimed() ? (
                      <Button
                        style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', width: '200px' }} // Red color for unclaim
                        type="button"
                        disabled={claimingPapers}
                        onClick={handleUnclaimPapers}
                      >
                        {claimingPapers ? 'Unclaiming...' : 'Unclaim Papers'}
                      </Button>
                    ) : (
                      <Button
                        style={{ backgroundColor: '#28a745', color: 'white', border: 'none', width: '200px' }} // Green color for claim
                        type="button"
                        disabled={claimingPapers}
                        onClick={handleClaimPapers}
                      >
                        {claimingPapers ? 'Claiming...' : 'Claim Papers'}
                      </Button>
                    )}
                  </Col>
                </Row>
              </>
            }
            {referencesToSortLive && referencesToSortLive.length === 0 && (
              <div>
                <br />
                <p>No Papers to sort</p>
              </div>
            )}
            {referencesToSortLive && referencesToSortLive.length > 0 && (
              <Container fluid>
                <RowDivider />
                {filteredPapers().map((reference, index) => (
                  <ReferencesToSort
                    key={`reference div ${index}`}
                    reference={reference}
                    index={index}
                    canSort={true}
                    speciesSelect={speciesSelect}
                    setSpeciesSelect={setSpeciesSelect}
                    speciesSelectLoading={speciesSelectLoading}
                    setSpeciesSelectLoading={setSpeciesSelectLoading}
                    typeaheadOptions={typeaheadOptions}
                    setTypeaheadOptions={setTypeaheadOptions}
                    speciesTypeaheadRef={speciesTypeaheadRef}
                    topicEntitySourceId={topicEntitySourceId}
                    accessToken={accessToken}
                    activeMod={activeMod}
                  />
                ))}
                <RowDivider />
                <Row>
                  <Col lg={12} className="text-center">
                    <SortSubmitUpdateRouter />
                    <Button
                      as="input"
                      style={{ backgroundColor: '#6b9ef3', color: 'white', border: 'none', width: '200px', marginRight: '10px' }} // Set width and margin
                      type="button"
                      disabled={buttonUpdateDisabled}
                      value="Update Sorting"
                      onClick={() => updateSorting()}
                    />{' '}
                    {hasUserClaimed() ? (
                      <Button
                        style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', width: '200px' }}
                        type="button"
                        disabled={claimingPapers}
                        onClick={handleUnclaimPapers}
                      >
                        {claimingPapers ? 'Unclaiming...' : 'Unclaim Papers'}
                      </Button>
                    ) : (
                      <Button
                        style={{ backgroundColor: '#28a745', color: 'white', border: 'none', width: '200px' }}
                        type="button"
                        disabled={claimingPapers}
                        onClick={handleClaimPapers}
                      >
                        {claimingPapers ? 'Claiming...' : 'Claim Papers'}
                      </Button>
                    )}
                  </Col>
                </Row>
              </Container>
            )}
          </>
        }

        {viewMode === 'Recently sorted' &&
          <>
            <Row className="justify-content-center">
              <Col lg="auto">
                <br />
                <Form>
                  <Form.Row className="align-items-end">
                    <Col md={5}>
                      <Form.Group controlId="formCuratorSelect">
                        <Form.Label style={{ fontWeight: 'bold' }}>Who:</Form.Label>
                        <Form.Control
                          as="select"
                          style={{ minWidth: '250px' }}
                          value={selectedCurator}
                          onChange={(e) => setSelectedCurator(e.target.value)}
                        >
                          {curatorOptions.map((curator, index) => (
                            <option key={index} value={curator.uid}>
                              {curator.email}
                            </option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group controlId="formTimeframeSelect">
                        <Form.Label style={{ fontWeight: 'bold' }}>When:</Form.Label>
                        <Form.Control
                          as="select"
                          value={selectedTimeframe}
                          onChange={(e) => setSelectedTimeframe(e.target.value)}
                        >
                          <option value="1">Today</option>
                          <option value="7">Past week</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col md={4} className="d-flex align-items-end">
                      <Form.Group>
                        <Form.Label>&nbsp;</Form.Label> {/* Empty label for alignment */}
                        <Button onClick={handleFindSortedPapers}>Find sorted papers</Button>
                      </Form.Group>
                    </Col>
                  </Form.Row>
                </Form>		  
              </Col>
            </Row>
            <Row>
              <Col lg={12}>
                <br />
                {recentlySortedData && recentlySortedData.length > 0 ? (
                  <div>      
                    <SortSubmitUpdateRouter />
                    <Button
                      variant="outline-primary"
                      className="ml-1"
                      onClick={() => setShowInsidePapers(!showInsidePapers)}
                    >
                      {showInsidePapers ? 'Show Outside Papers' : 'Show Inside Papers'}
                    </Button>
                    <p />
                    <Container fluid>
                      {recentlySortedData
                        .filter(ref => ref['mod_corpus_association_corpus'] === showInsidePapers)
                        .map((reference, index) => (
                          <ReferencesToSort
                            key={`reference div ${index}`}
                            reference={reference}
                            index={index}
                            canSort={false}
                            speciesSelect={speciesSelect}
                            setSpeciesSelect={setSpeciesSelect}
                            speciesSelectLoading={speciesSelectLoading}
                            setSpeciesSelectLoading={setSpeciesSelectLoading}
                            typeaheadOptions={typeaheadOptions}
                            setTypeaheadOptions={setTypeaheadOptions}
                            speciesTypeaheadRef={speciesTypeaheadRef}
                            topicEntitySourceId={topicEntitySourceId}
                            accessToken={accessToken}
                            activeMod={activeMod}
                          />
                        ))}
                      {recentlySortedData.filter(ref => ref['mod_corpus_association_corpus'] === showInsidePapers).length === 0 && (
                        <p>No {showInsidePapers ? 'inside' : 'outside'} papers found.</p>
                      )}
                    </Container>
                  </div>
                ) : (
                  <p>No sorted papers found.</p>
                )}
              </Col>
            </Row>
          </>
        }
      </Container>
      
      {/* Display claim/unclaim papers error if any */}
      {claimPapersError && (
        <Alert variant="danger">
          <Alert.Heading>{hasUserClaimed() ? 'Unclaim Papers Failed' : 'Claim Papers Failed'}</Alert.Heading>
          <p>{claimPapersError}</p>
        </Alert>
      )}

      <AlertAteamApiDown />
      <hr />
    </div>
  )
}

// SortSubmitUpdateRouter Component
const SortSubmitUpdateRouter = () => {
  const sortUpdating = useSelector(state => state.sort.sortUpdating);

  if (sortUpdating > 0) {
    return (<SortSubmitUpdating />);
  }
  else {
    return (<><AlertDismissibleSortUpdate /></>);
  }
}

// SortSubmitUpdating Component
const SortSubmitUpdating = () => {
  return (
    <div className="form-control biblio-updating" >Updating Sort data...</div>
  );
}

// AlertDismissibleSortUpdate Component
const AlertDismissibleSortUpdate = () => {
  const dispatch = useDispatch();
  const updateAlert = useSelector(state => state.sort.updateAlert);
  const updateFailure = useSelector(state => state.sort.updateFailure);
  const updateMessages = useSelector(state => state.sort.updateMessages);
  let variant = 'danger';
  let header = 'Update Failure';
  if (updateFailure === 0) {
    header = 'Update Success';
    variant = 'success';
  }
  else {
    header = 'Update Failure';
    variant = 'danger';
  }

  useEffect(() => {
    if (updateAlert && updateFailure === 0) {
      const timer = setTimeout(() => {
        dispatch(closeSortUpdateAlert());
      }, 2000); // dismiss after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [updateAlert, updateFailure, dispatch]);

  if (updateAlert) {
    return (
      <Alert variant={variant} onClose={() => dispatch(closeSortUpdateAlert())} dismissible>
        <Alert.Heading>{header}</Alert.Heading>
        {updateMessages.map((message, index) => (
          <div key={`${message} ${index}`}>{message}</div>
        ))}
      </Alert>
    );
  } else { return null; }
}

export default Sort;
