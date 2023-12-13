import {useSelector, useDispatch} from "react-redux";
import {useEffect, useState} from "react";
import {fetchDisplayTagData} from "../../../actions/biblioActions";
import { setTetPageSize as setPageSizeAction } from "../../../actions/biblioActions";
import axios from "axios";
import LoadingOverlay from "../../LoadingOverlay";
import Table from "react-bootstrap/Table";
import {FilterPopup} from "../FilterPopup";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFilter, faSortAlphaDown, faSortAlphaUp} from "@fortawesome/free-solid-svg-icons";
import Pagination from "react-bootstrap/Pagination";
import {getCurieToNameTaxon} from "./TaxonUtils";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const TopicEntityTable = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector(state => state.isLogged.accessToken);
  const oktaMod = useSelector(state => state.isLogged.oktaMod);
  const testerMod = useSelector(state => state.isLogged.testerMod);
  const accessLevel = (testerMod !== 'No') ? testerMod : oktaMod;  
  const [topicEntityTags, setTopicEntityTags] = useState([]);
  const [entityEntityMappings, setEntityEntityMappings] = useState({});
  const biblioUpdatingEntityRemoveEntity = useSelector(state => state.biblio.biblioUpdatingEntityRemoveEntity);
  const biblioUpdatingEntityAdd = useSelector(state => state.biblio.biblioUpdatingEntityAdd);
  const referenceCurie = useSelector(state => state.biblio.referenceCurie);
  const pageSize = useSelector(state => state.biblio.tetPageSize);
  const [totalTagsCount, setTotalTagsCount] = useState(undefined);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(null);
  const [descSort, setDescSort] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [showSpeciesFilter, setShowSpeciesFilter] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [speciesFilterPosition, setSpeciesFilterPosition] = useState({ top: 0, left: 0 });
  const [allSpecies, setAllSpecies] = useState([]);
  const curieToNameTaxon = getCurieToNameTaxon();
  const ecoToName = {
    'ECO:0000302': 'author statement used in manual assertion'
  };
  const [selectedCurie, setSelectedCurie] = useState(null);
    
  const handleSpeciesFilterClick = (e) => {
    const headerCell = e.target.closest('th');
    if (headerCell) {
      const rect = headerCell.getBoundingClientRect();
      setSpeciesFilterPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setShowSpeciesFilter(!showSpeciesFilter);
  };

  const handleCheckboxChange = (curie) => {
    setSelectedSpecies((prevSelected) =>
      prevSelected.includes(curie) ? prevSelected.filter((item) => item !== curie) : [...prevSelected, curie]
    );
    // keep the filter section open when checkboxes are checked
    setShowSpeciesFilter(true);
  };

  const handleClearButtonClick = () => {
    setSelectedSpecies([]);
    setShowSpeciesFilter(true);
  };

  const handleDeleteClick = async (tetDictToDelete) => {
    if (tetDictToDelete.topic_entity_tag_source.mod != accessLevel) {
      console.error("Permission denied. Cannot delete this row.");
      return;
    }
    try {
      const url = process.env.REACT_APP_RESTAPI + "/topic_entity_tag/" + tetDictToDelete.topic_entity_tag_id;	  
      const response = await axios.delete(url, {
        headers: {
            "Authorization": "Bearer " + accessToken,
	    "Content-Type": "application/json"
        }
      });

      // status_code=status.HTTP_204_NO_CONTENT
      if (response.status === 204) {
        // remove the deleted item from the state so that the UI updates
        setTopicEntityTags(prevTags => prevTags.filter(tag => tag !== tetDictToDelete));
      } else {
        console.error("Failed to delete the item:", response.data);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };
  
  const handleMouseLeave = () => {
    // Hide the species filter when the mouse leaves the filter area
    setShowSpeciesFilter(false);
  };

  const speciesInResultSet = new Set(allSpecies);
	    
  useEffect(() => {
    fetchDisplayTagData(accessToken);
  }, [accessToken]);

  useEffect(() => {
    const fetchMappings = async () => {
      if (topicEntityTags.length > 0) {
        let config = {
          headers: {
            'content-type': 'application/json',
            // 'authorization': 'Bearer ' + accessToken
          }
        };
        setIsLoadingMappings(true);
        try {
          const resultMappings = await axios.get(process.env.REACT_APP_RESTAPI + "/topic_entity_tag/map_entity_curie_to_name/?curie_or_reference_id=" + referenceCurie,
              config);
          setEntityEntityMappings(resultMappings.data);
        } finally {
          setIsLoadingMappings(false)
        }
      }
    }
    fetchMappings().then();
  }, [referenceCurie, topicEntityTags]);

  useEffect(() => {
    const fetchAllSpecies = async () => {
      const resultTags = await axios.get(process.env.REACT_APP_RESTAPI + '/topic_entity_tag/by_reference/' + referenceCurie + "?column_only=species");
      if (JSON.stringify(resultTags.data) !== JSON.stringify(allSpecies)) {
        setAllSpecies(resultTags.data);
      }
    }
    fetchAllSpecies().then();
  }, [referenceCurie, topicEntityTags, allSpecies])

  useEffect(() => {
    const fetchTotalTagsCount = async () => {
      let url = process.env.REACT_APP_RESTAPI + '/topic_entity_tag/by_reference/' + referenceCurie + "?count_only=true";
      if (selectedSpecies && selectedSpecies.length !== 0) {
        url = url + "&column_filter=species&column_values=" + selectedSpecies.join(',')
      }
      const resultTags = await axios.get(url);
      setTotalTagsCount(resultTags.data);
    }
    fetchTotalTagsCount().then();
  }, [biblioUpdatingEntityAdd, biblioUpdatingEntityRemoveEntity, referenceCurie, selectedSpecies])

  useEffect(() => {
    const fetchData = async () => {
      if (biblioUpdatingEntityAdd === 0) {
        let url = process.env.REACT_APP_RESTAPI + '/topic_entity_tag/by_reference/' + referenceCurie + "?page=" + page + "&page_size=" + pageSize
	if (selectedSpecies && selectedSpecies.length !== 0) {
	  url = url + "&column_filter=species&column_values=" + selectedSpecies.join(',')
	}
        if (sortBy !== null && sortBy !== undefined) {
          url += "&sort_by=" + sortBy
        }
        if (descSort) {
          url += "&desc_sort=true"
        }
        setIsLoadingData(true);
	try {  
          const resultTags = await axios.get(url);
          if (JSON.stringify(resultTags.data) !== JSON.stringify(topicEntityTags)) {
            setTopicEntityTags(resultTags.data);
          }
	} catch (error) {
	  console.error("Error fetching data:" + error);
        } finally { 
          setIsLoadingData(false);
	}
      }
    }
    fetchData().then();
  }, [sortBy, descSort, referenceCurie, biblioUpdatingEntityAdd, biblioUpdatingEntityRemoveEntity, page, pageSize, topicEntityTags, selectedSpecies]);
    
  const handlePageSizeChange = (event) => {
    const newSize = Number(event.target.value);
    dispatch(setPageSizeAction(newSize)); // update Redux store with new pageSize
  };

  const handleCurieClick = (curie) => {
    console.log("curie in 'handleCurieClick'=", curie);
    setSelectedCurie(curie);
  };

  const CuriePopup = ({ curie, onClose }) => {
    return (
      <div style={{ position: 'absolute', minWidth: '250px', maxWidth: '80%', border: '1px solid black', padding: '10px', background: '#E0F7FA', zIndex: 100 }}>
        <div>{curie}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
    
  const changePage = (action) => {
    let maxPage = Math.max(0, Math.ceil(totalTagsCount/pageSize));
    switch (action){
      case 'Next':
        setPage(Math.min(maxPage, page + 1));
        break;
      case 'Prev':
        setPage(Math.max(1, page - 1));
        break;
      case 'First':
        setPage(1);
        break;
      case 'Last':
        setPage(maxPage);
        break;
      default:
        setPage(1);
        break;
    }
  }

  let headers = [
    'topic', 'entity_type', 'species', 'entity', 'entity_published_as', 'negated',
    'novel_topic_data',
    'confidence_level', 'created_by', 'note', 'entity_source', 'date_created',
    'updated_by', 'date_updated', 'validation_value_author',
    'validation_value_curator', 'validation_value_curation_tools',
    'display_tag'
  ];   
  let source_headers = [
    'mod', 'source_method', 'evidence', 'validation_type', 'source_type',
    'description', 'created_by', 'date_updated', 'date_created'
  ];
  const headersWithSortability = new Set([
    'topic', 'entity_type', 'species', 'entity', 
    'entity_published_as', 'negated', 'novel_topic_data', 'confidence_level',
    'created_by', 'note', 'entity_source', 'date_created', 
    'updated_by', 'date_updated', 'display_tag', 
    'mod', 'source_method', 'description', 'evidence',
    'validation_type', 'source_type'
  ]);
  const dateColumnSet = new Set(['date_created', 'date_updated']);
  const headersToEntityMap = new Set(['topic', 'entity_type', 'entity', 'display_tag']);
  const headerToLabelMap = { 'negated': 'no data', 'novel_topic_data': 'novel data' };

  return (
    <div>
	{selectedCurie && <CuriePopup curie={selectedCurie} onClose={() => setSelectedCurie(null)} />}
        <LoadingOverlay active={isLoadingData || isLoadingMappings} />
	{/* Flex container for total rows and page size selection */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
	  {typeof totalTagsCount !== 'undefined' && (
            <h4 style={{textAlign: 'left', paddingLeft: '15px'}}>
              Total {totalTagsCount} rows
	    </h4>
          )}
          {/* Page Size Selection */}
          <Form.Group controlId="pageSizeSelect" style={{ marginRight: '15px' }}>
          <Form.Label style={{ marginRight: '10px' }}>Rows per page:</Form.Label>
            <Form.Control as="select" value={pageSize} onChange={handlePageSizeChange} style={{ display: 'inline-block', width: 'auto' }}>
              {[10, 25, 50, 100, 500].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </Form.Control>
          </Form.Group>
	</div>
        <Table
          bordered
          size="sm"
          responsive
	>
	  <thead>
            <tr>
	      <th>Actions</th>
              {headers.map((header, index) => (
                <th key={`tetTableHeader th ${index}`} style={{ whiteSpace: 'nowrap' }}>
                  {header === 'species' ? (
                    <>
                      <FontAwesomeIcon
                        icon={faFilter}
                        style={{ marginLeft: '5px', cursor: 'pointer', color: showSpeciesFilter ? '#0069d9' : 'black' }}
                        onClick={handleSpeciesFilterClick}
                      />
                      <span style={{ marginLeft: '10px' }}>{header}</span>
                      {headersWithSortability.has(header) ? (
                        <FontAwesomeIcon
                          icon={sortBy !== header || !descSort ? faSortAlphaDown : faSortAlphaUp}
                          style={{ marginLeft: '5px', color: sortBy === header ? '#0069d9' : 'black' }}
                          onClick={() => {
                            if (sortBy === header && descSort) {
                              setSortBy(null);
                              setDescSort(true);
                            } else {
                              setSortBy(header);
                              setDescSort(!descSort);
                            }
                          }}
                        />
                      ) : null}
		      <FilterPopup
                        show={showSpeciesFilter}
                        options={speciesInResultSet}
                        selectedOptions={selectedSpecies}
                        optionToName={curieToNameTaxon}
                        onOptionChange={handleCheckboxChange}
                        onClearClick={handleClearButtonClick}
                        onHideFilter={handleMouseLeave}
                        position={speciesFilterPosition}
                      />
                    </>
                  ) : (
                    <>
                      {(headerToLabelMap[header] !== undefined) ? (headerToLabelMap[header]) : (header) }
                      {headersWithSortability.has(header) ? (
                        <FontAwesomeIcon
                          icon={sortBy !== header || !descSort ? faSortAlphaDown : faSortAlphaUp}
                          style={{ color: sortBy === header ? '#0069d9' : 'black' }}
                          onClick={() => {
                            if (sortBy === header && descSort) {
                              setSortBy(null);
                              setDescSort(true);
                            } else {
                              setSortBy(header);
                              setDescSort(!descSort);
                            }
                          }}
                        />
                      ) : null}
                    </>
                  )}
                </th>
              ))}
              {source_headers.map((header, index) => (
                <th key={`tetTableHeaderSource th ${index}`}>
                  {header.startsWith('source_') ? header : 'source_' + header}
                  {headersWithSortability.has(header) ? (
                    <FontAwesomeIcon
                      icon={sortBy !== header || !descSort ? faSortAlphaDown : faSortAlphaUp}
                      style={{ color: sortBy === header ? '#0069d9' : 'black' }}
                      onClick={() => {
                        if (sortBy === header && descSort) {
                          setSortBy(null);
                          setDescSort(true);
                        } else {
                          setSortBy(header);
                          setDescSort(!descSort);
                        }
                      }}
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
          { topicEntityTags
	    .filter((tetDict) => {
              if (selectedSpecies.length > 0) {
                return selectedSpecies.includes(tetDict.species);
              }
              return true;
            })
	    .map( (tetDict, index_1) => {
              return (
                <tr key={`tetTableRow ${index_1}`}>     
		  <td>
                    {tetDict.topic_entity_tag_source.mod === accessLevel ? (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleDeleteClick(tetDict)}
                      >
                        Delete
		      </Button>	    
                    ) : null}
		  </td>
                  { headers.map( (header, index_2) => {
                    let td_value = tetDict[header];
                    if (td_value === true) { td_value = 'True'; }
                    else if (td_value === false) { td_value = 'False'; }
                    else if (dateColumnSet.has(header)) {
                      td_value = new Date(td_value).toLocaleString(); }
                    else if (headersToEntityMap.has(header)) {
                      td_value = tetDict[header] in entityEntityMappings ? entityEntityMappings[tetDict[header]] : tetDict[header];
                    } else if (header === "species") {
                      td_value = tetDict.species in curieToNameTaxon ? curieToNameTaxon[tetDict.species] : tetDict.species;
                    }
		    if (header === "entity") {
		      const name = entityEntityMappings[tetDict[header]] || tetDict[header];
	              const curie = tetDict[header];
		      const curieToShow = name + ": " + curie;
                      td_value = (
                        <span onClick={() => handleCurieClick(curieToShow)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                          {name}
                        </span>
                      );
                    }
                    return (<td key={`tetTable ${index_1} td ${index_2}`} >{td_value}</td>)
                  } ) }
                  { source_headers.map( (header, index_2) => {
                    let td_value = tetDict['topic_entity_tag_source'][header];
		    if (header === 'evidence') {
		       td_value = ecoToName[td_value] || td_value;
		    } 
                    else if (td_value === true) { td_value = 'True'; }
                    else if (td_value === false) { td_value = 'False'; }
                    if (dateColumnSet.has(header)) {
                       td_value = new Date(td_value).toLocaleString();
		    }
                    return (<td key={`tetTable ${index_1} td ${index_2}`} >{td_value}</td>)
                  } ) }
                </tr>);
          } ) }
          </tbody></Table>
          {totalTagsCount > 0 ?
            <Pagination style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '10vh'}}>
              <Pagination.First  onClick={() => changePage('First')} />
              <Pagination.Prev   onClick={() => changePage('Prev')} />
              <Pagination.Item  disabled>{"Page " + page + " of " + Math.ceil(totalTagsCount/pageSize)}</Pagination.Item>
              <Pagination.Next   onClick={() => changePage('Next')} />
              <Pagination.Last   onClick={() => changePage('Last')} />
            </Pagination>
           : null}
      </div>);
} // const EntityTable

export default TopicEntityTable;
