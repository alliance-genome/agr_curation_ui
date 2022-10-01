import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import React, { useState } from "react";


const OktaHelp = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return (
    <>
      <div style={{padding: '0 .5rem', alignSelf: 'center'}}>
        <Button variant="light" size="sm" type="button" onClick={handleShow}>Okta Help</Button>
      </div>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Okta Account Help</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          For help setting up an OKTA account please contact the OKTA administrator for your MOD or the Team where you are working.<br/><br/>
          <Container fluid>
            <Row><Col>Chris Tabone</Col><Col>FB</Col><Col>Specialist</Col></Row>
            <Row><Col>Olin Blodgett</Col><Col>MGI</Col><Col>A-Team</Col></Row>
            <Row><Col>Jeff De Pons</Col><Col>RGD</Col><Col>A-Team</Col></Row>
            <Row><Col>Stuart Miyasato</Col><Col>SGD</Col><Col></Col></Row>
            <Row><Col>Valerio Arnaboldi</Col><Col>WB</Col><Col>Blue-Team</Col></Row>
            <Row><Col>Juancarlos Chan</Col><Col>WB</Col><Col>Blue-Team</Col></Row>
            <Row><Col>Chris Grove</Col><Col>WB</Col><Col>A-Team</Col></Row>
            <Row><Col>Todd Harris</Col><Col>WB</Col><Col></Col></Row>
            <Row><Col>Adam Wright</Col><Col>WB</Col><Col>Specialist</Col></Row>
          </Container>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default OktaHelp
