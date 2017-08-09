var Row = require('../../common/bootstrap/Row.js');
var FullRow = require('../../common/bootstrap/FullRow.js');
var Col = require('../../common/bootstrap/Col.js');
var InfoBox = require('../../common/InfoBox.js');
var DebugView = require('./debugView/DebugView.js');
var ScoreBoard = require('./scoreBoard/ScoreBoard.js');
var Battlefield = require('./Battlefield.js');
var BootstrapRWD = require('../../../lib/BootstrapRWD.js');

module.exports = class BattleScreen extends React.Component {

  constructor(props) {
    super(props);
    this.battlefield = null;
    this.rwd = new BootstrapRWD();
    this.state = {
      qualityLevel: 1,
      phase: "loading",
      timeLeft: 0,
      tankList: [],
      windowSize: 'md'
    };
  }

  componentDidMount() {
    this.buildSimulation();
    var self = this;
    this.rwd.onChange((s) => this.setState({windowSize: s}));
    this.setState({windowSize: this.rwd.size});
  }

  componentWillUnmount() {
    this.rwd.dispose();
    this.rwd = null;
  }

  buildSimulation() {
    this.battlefield.buildSimulation();
  }

  onBattleReady() {
    var self = this;
    this.props.tankNameList.forEach(function(tankName) {
      self.battlefield.addTank({name: tankName});
    });

    this.updateTankList();
    this.battlefield.start();
    this.setState({phase: 'battle'});
  }

  onBattleFinish(result) {
    if(this.props.onFinish) {
      this.props.onFinish(result);
    }
  }

  updateTankList() {
    var tankList = this.battlefield.tankList.map((tank) => {
      return {
        id: tank.id,
        name: tank.fullName,
        debug: tank.debugData,
        state: tank.state,
        score: tank.score,
        energy: tank.energy,
      };
    });
    tankList.sort((a, b) => {
      return b.score - a.score;
    });
    for(var rank=0; rank < tankList.length; rank++) {
      tankList[rank].rank = rank;
    }
    this.setState({
      tankList: tankList,
      qualityLevel: this.battlefield.actualRendererQuality
    });
  }

  showError(msg) {
    if(this.props.onError) {
      this.props.onError(msg);
    }
  }

  render() {
    var loading = null;
    var scoreboard = <ScoreBoard
      tankList={this.state.tankList}
      refreshTime={200+1300*(1-this.state.qualityLevel)}
    />;
    var debugView = <DebugView
        visible={true}
        tankList={this.state.tankList}
        highlight={this.state.qualityLevel > 0.66}
      />;
    var fpsWarn = <InfoBox
      message="Animation refresh rate was reduced to increase speed of the battle. You can adjust quality setting in the top bar"
      title="FPS reduced"
      level="warning"
    />;
    if(this.state.phase == 'battle' && this.state.qualityLevel <= 0.05) {
      scoreboard = <InfoBox message="Scoreboard hidden to improve performance of battle simulation" title=" " level="info"/>;
      debugView = <InfoBox message="Debug View hidden to improve performance of battle simulation" title=" " level="info"/>;
    }
    if(this.state.phase == 'loading') {
      scoreboard = null;
      debugView = null;
      loading = <span>loading...</span>;
    }
    if(this.state.qualityLevel >= 0.3 || this.state.phase != 'battle') {
      fpsWarn = null;
    }
    return <div>
      <Row>
        <Col lg={8} md={8} sm={12}>
          {loading}
          {fpsWarn}
          <Battlefield
            ref={(battlefield) => this.battlefield = battlefield }
            width="900"
            height="600"
            speed={this.props.speed}
            quality={this.props.quality}
            renderer={this.props.renderer}
            visible={this.state.phase == "battle"}
            onReady={() => this.onBattleReady()}
            onError={(msg) => this.showError(msg)}
            onRender={() => this.updateTankList()}
            onFinish={(result) => this.onBattleFinish(result)}
          />
          {this.rwd.equalOrBiggerThan('md') ? scoreboard : null}
        </Col>
        <Col lg={4} md={4} sm={12} >
          {debugView}
        </Col>
      </Row>
      <FullRow>
        {this.rwd.smallerThan('md') ? scoreboard : null}
      </FullRow>
    </div>;
  }
};