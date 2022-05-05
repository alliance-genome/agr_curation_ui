import React, {useState} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {Dropdown, InputGroup, Spinner} from 'react-bootstrap';
import {searchReferences} from '../../actions/queryActions';
import {useDispatch, useSelector} from 'react-redux';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";


const SearchBar = () => {

    const [fieldToSearch, setFieldToSearch] = useState('Title');
    const [searchInputText, setSearchInputText] = useState('');

    const searchLoading = useSelector(state => state.query.searchLoading);
    const searchFacetsValues = useSelector(state => state.query.searchFacetsValues);
    const searchFacetsLimits = useSelector(state => state.query.searchFacetsLimits);
    const searchResultsCount = useSelector(state => state.query.searchResultsCount);
    const searchResults = useSelector(state => state.query.searchResults);
    const searchSuccess = useSelector(state => state.query.searchSuccess);

    const dispatch = useDispatch();

    return (
        <>
        <div style={{width: "40em", margin: "auto"}}>
            <InputGroup className="mb-2">
                <Dropdown>
                    <Dropdown.Toggle variant="success" id="dropdown-basic">
                        {fieldToSearch}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setFieldToSearch('All text fields')}>All text fields</Dropdown.Item>
                        <Dropdown.Item onClick={() => setFieldToSearch('Title')}>Title</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Form.Control inline="true" type="text" id="titleField" name="titleField" value={searchInputText}
                              onChange={(e) => setSearchInputText(e.target.value)}
                              onKeyPress={(event) => {
                                  if (event.charCode === 13) {
                                      dispatch(searchReferences(searchInputText, searchFacetsValues, searchFacetsLimits));
                                  }
                              }}
                />
                <Button inline="true"
                        onClick={() => dispatch(searchReferences(searchInputText, searchFacetsValues, searchFacetsLimits))}>
                    Search
                </Button>
            </InputGroup>
            <div style={{height: "3em"}}>
                {searchLoading ?
                    <div>
                        <br/>
                        <Spinner animation="border"/>
                    </div> : null
                }
                {
                searchResults.length === 0 && searchSuccess ?
                    <div>
                        No Results Found
                    </div> : null
                }
            </div>
        </div>
        <Container fluid>
            <Row>
                <Col sm={2}>
                    <Card>
                        <Card.Body>{searchResultsCount} results</Card.Body>
                    </Card>
                </Col>
                <Col sm={10}>
                </Col>
            </Row>
        </Container>
        </>
    )
}

export default SearchBar;
