import React from 'react'
import ReactDOM from 'react-dom'

class Canvas extends React.Component {
    constructor(props) {
        super(props);
        this.canvasRef = React.createRef();
        this.updateAnimationState = this.updateAnimationState.bind(this);
    }

    componentDidMount() {
    }
    
    updateAnimationState() {
        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.fillStyle = '#4397AC';
        ctx.fillRect(0, 0, 20, 20);
        requestAnimationFrame(this.updateAnimationState);
    }

    render() {
        return (
            <div>
                <canvas width="300" height="300" ref={this.canvasRef}/>
            </div>
        );
    }
}

export default Canvas
// ReactDOM.render(<Canvas />, document.getElementById('root'))