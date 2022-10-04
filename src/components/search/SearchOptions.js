import React from 'react';
import Form from 'react-bootstrap/Form';
import {searchReferences, setSearchSizeResultsCount, setSearchResultsPage} from '../../actions/searchActions';
import {useDispatch, useSelector} from 'react-redux';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Pagination from 'react-bootstrap/Pagination';



const SearchOptions = () => {

    const searchQuery = useSelector(state => state.search.searchQuery);
    const searchFacetsValues = useSelector(state => state.search.searchFacetsValues);
    const searchFacetsLimits = useSelector(state => state.search.searchFacetsLimits);
    const searchResultsCount = useSelector(state => state.search.searchResultsCount);
    const searchSizeResultsCount = useSelector(state => state.search.searchSizeResultsCount);
    const searchResultsPage  = useSelector(state => state.search.searchResultsPage);

    const dispatch = useDispatch();

    function changePage(action){
      let page = searchResultsPage;
      let lastPage= parseInt(searchResultsCount/searchSizeResultsCount);
      switch (action){
        case 'Next':
          page=Math.min(lastPage,page+1);
          break;
        case 'Prev':
          page=Math.max(0,page-1);
          break;
        case 'First':
          page=0;
          break;
        case 'Last':
          page=lastPage;
          break;
        default:
          page=0;
          break;

      }
      dispatch(setSearchResultsPage(page));
      dispatch(searchReferences(searchQuery, searchFacetsValues, searchFacetsLimits, searchSizeResultsCount,page));
    }


    return (
        <Container fluid>
            <Row>
                <Col sm={2}>
                    <div className="div-grey-border">
                        {searchResultsCount > 0 ? searchResultsCount + " results": null}
                    </div>
                </Col>
                <Col sm={2}>
                    <Form.Control as="select" id="selectSizeResultsCount" name="selectSizeResultsCount"
                                  onChange={(e) => {
                                      const intSizeResultsCount = parseInt(e.target.value.replace('Results per page ', ''));
                                      dispatch(setSearchSizeResultsCount(intSizeResultsCount));
                                      dispatch(setSearchResultsPage(0));
                                      dispatch(searchReferences(searchQuery, searchFacetsValues, searchFacetsLimits, intSizeResultsCount,0));
                                  } }>
                        <option>Results per page 10</option>
                        <option>Results per page 25</option>
                        <option>Results per page 50</option>
                    </Form.Control>
                </Col>
                <Col sm={6}>
                  <Pagination>
                    <Pagination.First  onClick={() => changePage('First')} />
                    <Pagination.Prev   onClick={() => changePage('Prev')} />
                    <Pagination.Item   active>{searchResultsPage+1}</Pagination.Item>
                    <Pagination.Next   onClick={() => changePage('Next')} />
                    <Pagination.Last   onClick={() => changePage('Last')} />
                  </Pagination>
                </Col>
                <Col sm={2}>
                </Col>
            </Row>
        </Container>
    )
}

export default SearchOptions;
