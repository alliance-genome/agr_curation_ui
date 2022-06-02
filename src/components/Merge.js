// import { Link } from 'react-router-dom'
// import { useHistory } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';

import { changeFieldInput } from '../actions/mergeActions';
import { mergeQueryReferences } from '../actions/mergeActions';
import { mergeResetReferences } from '../actions/mergeActions';
import { mergeSwapKeep } from '../actions/mergeActions';
import { mergeSwapPairSimple } from '../actions/mergeActions';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons'
// import { faLongArrowAltLeft } from '@fortawesome/free-solid-svg-icons'


const RowDivider = () => { return (<Row><Col>&nbsp;</Col></Row>); }

const fieldsSimple = ['curie', 'reference_id', 'title', 'category', 'citation', 'volume', 'page_range', 'language', 'abstract', 'pubmed_abstract_languages', 'plain_language_abstract', 'publisher', 'issue_name', 'date_published', 'date_arrived_in_pubmed', 'date_last_modified_in_pubmed', 'resource_curie', 'resource_title' ];
// const fieldsArrayString = ['keywords', 'pubmed_types' ];
const fieldsOrdered = [ 'title', 'mod_corpus_associations', 'cross_references', 'corrections', 'authors', 'DIVIDER', 'abstract', 'pubmed_abstract_languages', 'plain_language_abstract', 'DIVIDER', 'category', 'pubmed_types', 'mod_reference_types', 'DIVIDER', 'resource_curie', 'resource_title', 'volume', 'issue_name', 'page_range', 'DIVIDER', 'editors', 'publisher', 'language', 'DIVIDER', 'date_published', 'date_arrived_in_pubmed', 'date_last_modified_in_pubmed', 'DIVIDER', 'tags', 'DIVIDER', 'keywords', 'mesh_terms' ];
// const fieldsOrdered = [ 'title', 'mod_corpus_associations', 'cross_references', 'corrections', 'authors', 'DIVIDER', 'citation', 'abstract', 'pubmed_abstract_languages', 'plain_language_abstract', 'DIVIDER', 'category', 'pubmed_types', 'mod_reference_types', 'DIVIDER', 'resource_curie', 'resource_title', 'volume', 'issue_name', 'page_range', 'DIVIDER', 'editors', 'publisher', 'language', 'DIVIDER', 'date_published', 'date_arrived_in_pubmed', 'date_last_modified_in_pubmed', 'DIVIDER', 'tags', 'DIVIDER', 'keywords', 'mesh_terms' ];

const MergeSelectionSection = () => {
  const keepReference = useSelector(state => state.merge.keepReference);
  const referenceMeta1 = useSelector(state => state.merge.referenceMeta1);
  const referenceMeta2 = useSelector(state => state.merge.referenceMeta2);
  const referenceSwap = useSelector(state => state.merge.referenceSwap);
  const queryDoubleSuccess = useSelector(state => state.merge.queryDoubleSuccess);
  // swap icon fa-exchange
  // left arrow icon fa-arrow-left 
  // <FontAwesomeIcon size='lg' icon={faLongArrowAltLeft} />

  let header1 = (<span style={{fontSize: '1.2rem', color: 'green'}}>Keep</span>)
  let header2 = (<span style={{fontSize: '1.2rem', color: 'red'}}>Obsolete</span>)
  if (keepReference === 2) {
    header2 = (<span style={{fontSize: '1.2rem', color: 'green'}}>Keep</span>)
    header1 = (<span style={{fontSize: '1.2rem', color: 'red'}}>Obsolete</span>) }
  
  const dispatch = useDispatch();
  return (
    <>
    <Container>
      <Row>
        <Col sm="5" >{header1}<br/>
          <Form.Control as="input" id="referenceMeta1.input" value={referenceMeta1.input} disabled={referenceMeta1.disableInput} onChange={(e) => dispatch(changeFieldInput(e, 'referenceMeta1', 'input'))} />
          <span style={{color: referenceMeta1.messageColor}}>{referenceMeta1.message}</span>
        </Col>
        <Col sm="2" ><br/>
          <Button onClick={(e) => dispatch(mergeSwapKeep())}>Swap <FontAwesomeIcon icon={faExchangeAlt} /></Button>
        </Col>
        <Col sm="5" >{header2}<br/>
          <Form.Control as="input" id="referenceMeta2.input" value={referenceMeta2.input} disabled={referenceMeta2.disableInput} onChange={(e) => dispatch(changeFieldInput(e, 'referenceMeta2', 'input'))} />
          <span style={{color: referenceMeta2.messageColor}}>{referenceMeta2.message}</span>
        </Col>
      </Row>
      <Row>
        <Col sm="12" >
          {(() => {
            if (queryDoubleSuccess) { return (<Button variant='warning' onClick={() => dispatch(mergeResetReferences())} >Discard changes and new query</Button>) }
            return (<Button variant='primary' onClick={(e) => dispatch(mergeQueryReferences(referenceMeta1.input, referenceMeta2.input))} >Query for these references</Button>);
          })()}
        </Col>
      </Row>
      <RowDivider />
    </Container>

    {(() => {
      if (queryDoubleSuccess) { return (
        <MergePairsSection referenceMeta1={referenceMeta1} referenceMeta2={referenceMeta2} referenceSwap={referenceSwap} keepReference={keepReference} />
      ) }
    })()}
    </>
  );
}

// <RowDisplayString key={fieldName} fieldName={fieldName} referenceJsonLive={referenceJsonLive} referenceJsonDb={referenceJsonDb} />

//       <RowDisplayPairSimple key="title" fieldName="title" referenceMeta1={referenceMeta1} referenceMeta2={referenceMeta2} referenceSwap={referenceSwap} keepReference={keepReference} />
//       <RowDisplayPairSimple key="category" fieldName="category" referenceMeta1={referenceMeta1} referenceMeta2={referenceMeta2} referenceSwap={referenceSwap} keepReference={keepReference} />

//       <Row>
//         <Col sm="2" >Title</Col>
//         <Col sm="5" >{referenceMeta1.referenceJson.title}</Col>
//         <Col sm="5" >{referenceMeta2.referenceJson.title}</Col>
//       </Row>
//       <Row>
//         <Col sm="2" >Category</Col>
//         <Col sm="5" >{referenceMeta1.referenceJson.category}</Col>
//         <Col sm="5" >{referenceMeta2.referenceJson.category}</Col>
//       </Row>

const MergePairsSection = ({referenceMeta1, referenceMeta2, referenceSwap, keepReference}) => {
  const rowOrderedElements = []
  for (const [fieldIndex, fieldName] of fieldsOrdered.entries()) {
    if (fieldName === 'DIVIDER') {
      rowOrderedElements.push(<RowDivider key={fieldIndex} />); }
    else if (fieldsSimple.includes(fieldName)) {
      rowOrderedElements.push(
        <RowDisplayPairSimple key={fieldName} fieldName={fieldName} referenceMeta1={referenceMeta1} referenceMeta2={referenceMeta2} referenceSwap={referenceSwap} keepReference={keepReference} /> ); }
  }
  return (<Container fluid>{rowOrderedElements}</Container>);
} // const MergePairsSection


const RowDisplayPairSimple = ({fieldName, referenceMeta1, referenceMeta2, referenceSwap, keepReference}) => {
  const dispatch = useDispatch();
  if ( (referenceMeta1['referenceJson'][fieldName] === null ) &&
       (referenceMeta2['referenceJson'][fieldName] === null ) ) { return null; }
  let keepClass1 = 'div-merge-keep';
  let keepClass2 = 'div-merge-obsolete';
  let swapColor = false;
  if (keepReference === 2) { swapColor = !swapColor; }
  if ( (fieldName in referenceSwap) && (referenceSwap[fieldName] === true) ) { swapColor = !swapColor; }
  if (swapColor) { keepClass2 = [keepClass1, keepClass1 = keepClass2][0]; }
  return (
    <Row>
      <Col sm="2" ><div className={`div-merge div-merge-grey`}>{fieldName}</div></Col>
      <Col sm="5" ><div className={`div-merge ${keepClass1}`} onClick={() => dispatch(mergeSwapPairSimple(fieldName))} >{referenceMeta1['referenceJson'][fieldName]}</div></Col>
      <Col sm="5" ><div className={`div-merge ${keepClass2}`} onClick={() => dispatch(mergeSwapPairSimple(fieldName))} >{referenceMeta2['referenceJson'][fieldName]}</div></Col>
    </Row>
  )
}
//       <Col sm="2" ><div className={`div-merge div-merge-grey`}>{fieldName}</div></Col>
//       <Col sm="2" className={`div-merge div-merge-grey`}>{fieldName}</Col>
//       <Col sm="5" className={`div-merge div-merge-keep`}>{referenceMeta1['referenceJson'][fieldName]}</Col>
//       <Col sm="5" className={`div-merge div-merge-obsolete`}>{referenceMeta2['referenceJson'][fieldName]}</Col>

const Merge = () => {
  return (
    <div>
      <h4>Merge two References</h4>
      <MergeSelectionSection />
    </div>
  )
}

export default Merge
