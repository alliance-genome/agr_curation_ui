// import { Link } from 'react-router-dom'

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button'


const Download = () => {
  const mods = ['FB', 'MGI', 'RGD', 'SGD', 'WB', 'ZFIN']

  return (
    <Container>
      <Row>
        <Col>
          <h4>Download latest MOD reference dump .json</h4>
        </Col>
      </Row>
      <Row><Col>&nbsp;</Col></Row>
      <Row>
        <Col sm={4}></Col>
        <Col sm={2}>
            <Form.Control as="select" name="mods" type="select" htmlSize="1" style={{width: '10em'}} >
              {mods.map((optionValue, index) => (
                  <option key={`mod ${index} ${optionValue}`}>{optionValue}</option>
              ))}
            </Form.Control>
        </Col>
        <Col sm={2}>
            <Button style={{width: "12em"}} >Download json</Button>
        </Col>
        <Col sm={4}></Col>
      </Row>
    </Container>
  )
}

export default Download
