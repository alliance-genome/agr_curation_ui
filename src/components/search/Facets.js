import React, {useEffect, useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {
    addFacetValue,
    fetchInitialFacets,
    removeFacetValue,
    searchReferences,
    setSearchFacetsLimits,
    setSearchResultsPage,
    setAuthorFilter,
    filterFacets,
    setDatePubmedAdded,
    setDatePubmedModified,
    setDatePublished,
    setDateCreated
} from '../../actions/searchActions';
import Form from 'react-bootstrap/Form';
import {Badge, Button, Collapse} from 'react-bootstrap';
import {IoIosArrowDroprightCircle, IoIosArrowDropdownCircle} from 'react-icons/io';
import {INITIAL_FACETS_LIMIT} from '../../reducers/searchReducer';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import InputGroup from 'react-bootstrap/InputGroup';
import _ from "lodash";
import DateRangePicker from '@wojtekmaj/react-daterange-picker'
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css';
import LoadingOverlay from "../LoadingOverlay";

export const RENAME_FACETS = {
    "category.keyword": "alliance category",
    "mods_in_corpus.keyword": "corpus - in corpus",
    "mods_needs_review.keyword": "corpus - needs review",
    "mods_in_corpus_or_needs_review.keyword": "corpus - in corpus or needs review",
    "authors.name.keyword": "Authors",
    "mod_reference_types.keyword": "MOD reference type"
}

export const FACETS_CATEGORIES_WITH_FACETS = {
    "Alliance Metadata": ["mods in corpus", "mods needs review", "mods in corpus or needs review"],
    "Bibliographic Data": ["mod reference types", "pubmed types", "category", "pubmed publication status", "authors.name"],
    "Date Range": ["Date Modified in Pubmed", "Date Added To Pubmed", "Date Published","Date Added to ABC"]

}

const DatePicker = ({facetName,currentValue,setValueFunction}) => {
    const dispatch = useDispatch();
    console.log(currentValue);

    function formatDateRange(dateRange){
        //let dateStart=dateRange[0].getFullYear()+"-"+parseInt(dateRange[0].getMonth()+1)+"-"+dateRange[0].getDate();
        let dateStart = dateRange[0].toISOString().split('T')[0];
        //let dateEnd=dateRange[1].getFullYear()+"-"+parseInt(dateRange[1].getMonth()+1)+"-"+dateRange[1].getDate();
        let dateEnd = dateRange[1].toISOString().split('T')[0];
        return [dateStart,dateEnd];
    }

    return(
        <div key={facetName} style={{textAlign: "left", paddingLeft: "2em"}}>
            <h5>{facetName}</h5>
            <DateRangePicker value={currentValue} onChange= {(newDateRangeArr) => {
                if (newDateRangeArr === null) {
                    dispatch(setValueFunction(''));
                    dispatch(setSearchResultsPage(1));
                    dispatch(searchReferences());
                }
                else if(!isNaN(Date.parse(newDateRangeArr[0])) && !isNaN(Date.parse(newDateRangeArr[1]))){
                    dispatch(setValueFunction(formatDateRange(newDateRangeArr)));
                    dispatch(setSearchResultsPage(1));
                    dispatch(searchReferences());
                }

            }}/>
        </div>
    )
}
const DateFacet = ({facetsToInclude}) => {

  const datePubmedModified = useSelector(state => state.search.datePubmedModified);
  const datePubmedAdded = useSelector(state => state.search.datePubmedAdded);
  const datePublished = useSelector(state => state.search.datePublished);
  const dateCreated = useSelector(state => state.search.dateCreated);
  const dispatch = useDispatch();

  function formatDateRange(dateRange){
    let dateStart=dateRange[0].getFullYear()+"-"+parseInt(dateRange[0].getMonth()+1)+"-"+dateRange[0].getDate();
    let dateEnd=dateRange[1].getFullYear()+"-"+parseInt(dateRange[1].getMonth()+1)+"-"+dateRange[1].getDate();
    return [dateStart,dateEnd];
  }

  return (
    <div>
        <DatePicker facetName={facetsToInclude[2]} currentValue={datePublished} setValueFunction={setDatePublished}/>
        <DatePicker facetName={facetsToInclude[3]} currentValue={dateCreated} setValueFunction={setDateCreated}/>
      <div key={facetsToInclude[0]} style={{textAlign: "left", paddingLeft: "2em"}}>
      <h5>{facetsToInclude[0]}</h5>
        <DateRangePicker value={datePubmedModified} onChange= {(newDateRangeArr) => {
          if (newDateRangeArr === null) {
            dispatch(setDatePubmedModified(''));
          }
          else {
            dispatch(setDatePubmedModified(formatDateRange(newDateRangeArr)));
          }
          dispatch(setSearchResultsPage(1));
          dispatch(searchReferences());
        }}/>
      </div>
      <div key={facetsToInclude[1]} style={{textAlign: "left", paddingLeft: "2em"}}>
      <h5>{facetsToInclude[1]}</h5>
        <DateRangePicker value={datePubmedAdded} onChange= {(newDateRangeArr) => {
          if (newDateRangeArr === null) {
            dispatch(setDatePubmedAdded(''));
          }
          else {
            dispatch(setDatePubmedAdded(formatDateRange(newDateRangeArr)));
          }
          dispatch(setSearchResultsPage(1));
          dispatch(searchReferences());
        }}/>
      </div>
    </div>
  )
}

const Facet = ({facetsToInclude, renameFacets}) => {

    const searchFacets = useSelector(state => state.search.searchFacets);
    const searchFacetsValues = useSelector(state => state.search.searchFacetsValues);
    const dispatch = useDispatch();

    return (
        <div>
            {Object.entries(searchFacets).length > 0 && facetsToInclude.map(facetToInclude => {
                    let key = facetToInclude + '.keyword'
                    key = key.replaceAll(' ', '_');
                    if (key in searchFacets) {
                        let value = searchFacets[key];

                        return (
                            <div key={facetToInclude} style={{textAlign: "left", paddingLeft: "2em"}}>
                                <div>
                                    <h5>{renameFacets.hasOwnProperty(key) ? renameFacets[key] : key.replace('.keyword', '').replaceAll('_', ' ')}</h5>
                                    {facetToInclude === 'authors.name' ? <AuthorFilter/> : ''}
                                    {value.buckets.map(bucket =>
                                        <Container key={bucket.key}>
                                            <Row>
                                                <Col sm={1}>
                                                    <Form.Check inline type="checkbox"
                                                                checked={searchFacetsValues.hasOwnProperty(key) && searchFacetsValues[key].includes(bucket.key)}
                                                                onChange={(evt) => {
                                                                    if (evt.target.checked) {
                                                                        dispatch(addFacetValue(key, bucket.key));
                                                                    } else {
                                                                        dispatch(removeFacetValue(key, bucket.key));
                                                                    }
                                                                }}/>
                                                </Col>
                                                <Col sm={8}>
                                                    <span dangerouslySetInnerHTML={{__html: bucket.key}} />
                                                </Col>
                                                <Col>
                                                    <Badge variant="secondary">{bucket.doc_count}</Badge>
                                                </Col>
                                            </Row>
                                        </Container>)}
                                    <ShowMoreLessAllButtons facetLabel={key} facetValue={value} />
                                    <br/>
                                </div>
                            </div>
                        )
                    } else {
                        return null
                    }
                }
            )}
        </div>
    )
}

const AuthorFilter = () => {
  const searchQuery = useSelector(state => state.search.searchQuery);
  const searchFacetsLimits = useSelector(state => state.search.searchFacetsLimits);
  const searchSizeResultsCount = useSelector(state => state.search.searchSizeResultsCount);
  const searchFacetsValues = useSelector(state => state.search.searchFacetsValues);
  const authorFilter = useSelector(state => state.search.authorFilter);
  const searchResultsPage  = useSelector(state => state.search.searchResultsPage);
  const datePubmedModified = useSelector(state => state.search.datePubmedModified);
  const datePubmedAdded = useSelector(state => state.search.datePubmedAdded);
  const datePublished = useSelector(state => state.search.datePublished);
  const dispatch = useDispatch();

  return (
    <InputGroup size="sm" className="mb-3" style ={{width: "85%"}}>
    <Form.Control inline="true" type="text" id="authorFilter" name="authorFilter" placeholder="Filter Authors (case sensitive)" value={authorFilter}
                  onChange={(e) => dispatch(setAuthorFilter(e.target.value))}
                  onKeyPress={(event) => {
                      if (event.charCode === 13) {
                          dispatch(filterFacets(searchQuery, searchFacetsValues, searchFacetsLimits, searchSizeResultsCount,searchResultsPage,authorFilter,datePubmedAdded,datePubmedModified,datePublished))
                      }
                  }}
    />
    <Button inline="true" style={{width: "4em"}} size="sm"
      onClick={() => {
        dispatch(filterFacets(searchQuery, searchFacetsValues, searchFacetsLimits, searchSizeResultsCount,searchResultsPage,authorFilter,datePubmedAdded,datePubmedModified,datePublished))
      }}>Filter</Button>
      <Button variant="danger" size = "sm"
        onClick={() => {
          dispatch(setAuthorFilter(''));
          dispatch(filterFacets(searchQuery, searchFacetsValues, searchFacetsLimits, searchSizeResultsCount,searchResultsPage,"",datePubmedAdded,datePubmedModified,datePublished)
      )}}>X</Button></InputGroup>
  )
}


const ShowMoreLessAllButtons = ({facetLabel, facetValue}) => {

    const searchQuery = useSelector(state => state.search.searchQuery);
    const searchFacetsLimits = useSelector(state => state.search.searchFacetsLimits);
    const searchSizeResultsCount = useSelector(state => state.search.searchSizeResultsCount);
    const searchFacetsValues = useSelector(state => state.search.searchFacetsValues);
    const authorFilter = useSelector(state => state.search.authorFilter);
    const searchResultsPage  = useSelector(state => state.search.searchResultsPage);
    const datePubmedModified = useSelector(state => state.search.datePubmedModified);
    const datePubmedAdded = useSelector(state => state.search.datePubmedAdded);
    const datePublished = useSelector(state => state.search.datePublished);
    const dispatch = useDispatch();

    return (
        <div style={{paddingLeft: "1em"}}>
            {facetValue.buckets.length >= searchFacetsLimits[facetLabel] ?
                <button className="button-to-link" onClick={()=> {
                    let newSearchFacetsLimits = _.cloneDeep(searchFacetsLimits);
                    newSearchFacetsLimits[facetLabel] = searchFacetsLimits[facetLabel] * 2;
                    dispatch(setSearchFacetsLimits(newSearchFacetsLimits));
                    dispatch(filterFacets(searchQuery, searchFacetsValues, newSearchFacetsLimits, searchSizeResultsCount,searchResultsPage,authorFilter,datePubmedAdded,datePubmedModified,datePublished));
                }}>+Show More</button> : null
            }
            {searchFacetsLimits[facetLabel] > INITIAL_FACETS_LIMIT ?
                <span>&nbsp;&nbsp;&nbsp;&nbsp;<button className="button-to-link" onClick={() => {
                    let newSearchFacetsLimits = _.cloneDeep(searchFacetsLimits);
                    newSearchFacetsLimits[facetLabel] = searchFacetsLimits[facetLabel] = INITIAL_FACETS_LIMIT;
                    dispatch(setSearchFacetsLimits(newSearchFacetsLimits));
                    dispatch(filterFacets(searchQuery, searchFacetsValues, newSearchFacetsLimits, searchSizeResultsCount,searchResultsPage,authorFilter,datePubmedAdded,datePubmedModified,datePublished));
                }}>-Show Less</button></span> : null
            }
            {facetValue.buckets.length >= searchFacetsLimits[facetLabel] ? <span>&nbsp;&nbsp;&nbsp;&nbsp;
                <button className="button-to-link" onClick={() =>{
                    let newSearchFacetsLimits = _.cloneDeep(searchFacetsLimits);
                    newSearchFacetsLimits[facetLabel] = searchFacetsLimits[facetLabel] = 1000;
                    dispatch(setSearchFacetsLimits(newSearchFacetsLimits));
                    dispatch(filterFacets(searchQuery, searchFacetsValues, newSearchFacetsLimits, searchSizeResultsCount,searchResultsPage,authorFilter,datePubmedAdded,datePubmedModified,datePublished));
                }}>+Show All</button></span> : null }
            </div>
    )
}


const Facets = () => {

    const [openFacets, setOpenFacets] = useState(new Set());
    const searchResults = useSelector(state => state.search.searchResults);
    const searchFacets = useSelector(state => state.search.searchFacets);
    const searchFacetsValues = useSelector(state => state.search.searchFacetsValues);
    const searchFacetsLimits = useSelector(state => state.search.searchFacetsLimits);
    const searchQuery = useSelector(state => state.search.searchQuery);
    const facetsLoading = useSelector(state => state.search.facetsLoading);
    const datePubmedModified = useSelector(state => state.search.datePubmedModified);
    const datePubmedAdded = useSelector(state => state.search.datePubmedAdded);
    const datePublished= useSelector(state => state.search.datePublished);
    const dispatch = useDispatch();

    const toggleFacetGroup = (facetGroupLabel) => {
        let newOpenFacets = new Set([...openFacets]);
        if (newOpenFacets.has(facetGroupLabel)) {
            newOpenFacets.delete(facetGroupLabel);
        } else {
            newOpenFacets.add(facetGroupLabel);
        }
        setOpenFacets(newOpenFacets);
    }

    useEffect(() => {
        if (Object.keys(searchFacets).length === 0 && searchResults.length === 0) {
            dispatch(fetchInitialFacets(searchFacetsLimits));
        } else {
            if (searchQuery !== "" || searchResults.length > 0 || Object.keys(searchFacetsValues).length > 0) {
                dispatch(setSearchResultsPage(1));
                dispatch(setAuthorFilter(""));
                dispatch(searchReferences());
            }
        }
    }, [searchFacetsValues]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        let newOpenFacets = new Set([...openFacets]);
        Object.keys(searchFacetsValues).forEach(facet =>
            Object.entries(FACETS_CATEGORIES_WITH_FACETS).forEach(([category, facetsInCategory]) => {
                if (facetsInCategory.includes(facet.replace('.keyword', '').replaceAll('_', ' '))) {
                    newOpenFacets.add(category);
                }
            })
        );
        if (datePubmedAdded || datePubmedModified || datePublished) {
            newOpenFacets.add('Date Range');
        }
        setOpenFacets(newOpenFacets);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <LoadingOverlay active={facetsLoading} />
            {
                Object.entries(FACETS_CATEGORIES_WITH_FACETS).map(([facetCategory, facetsInCategory]) =>
                    <div key={facetCategory} style={{textAlign: "left"}}>
                        <Button variant="light" size="lg" eventkey="0" onClick={() => toggleFacetGroup(facetCategory)}>
                            {openFacets.has(facetCategory) ? <IoIosArrowDropdownCircle/> : <IoIosArrowDroprightCircle/>} {facetCategory}
                        </Button>
                        <Collapse in={openFacets.has(facetCategory)}>
                            <div>
                                {facetCategory === 'Date Range' ? <DateFacet facetsToInclude={facetsInCategory}/> : <Facet facetsToInclude={facetsInCategory} renameFacets={RENAME_FACETS}/>}
                            </div>
                        </Collapse>
                    </div>
                )
            }
        </>
    )
}

export default Facets;
