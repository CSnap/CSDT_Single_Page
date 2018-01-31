// External Imports: Tone.js

/**
 * Provides an interface with Tone.js
 */
function Synthesizer() {
    this.synth = new Tone.Synth().toMaster();
}

Synthesizer.prototype.test = function() {
    let _self = this;
    let loop_0 = function(time) {
        _self.synth.triggerAttackRelease("C4", "4n", time + 0);
        _self.synth.triggerAttackRelease("Eb4", "4n", time + 0.5);
        _self.synth.triggerAttackRelease("G4", "4n", time + 1);
        _self.synth.triggerAttackRelease("Bb4", "4n", time + 1.5); 
        _self.synth.triggerAttackRelease("C4", "4n", time + 2);
        _self.synth.triggerAttackRelease("Eb4", "4n", time + 2.5);
        _self.synth.triggerAttackRelease("G4", "4n", time + 3);
        _self.synth.triggerAttackRelease("Bb4", "4n", time + 3.5); 
    }

    Tone.Transport.schedule(loop_0, 0);
    Tone.Transport.loopEnd = '1m';
    Tone.Transport.loop = true;

    Tone.Transport.start();
}

export { Synthesizer };