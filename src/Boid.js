import * as THREE from "https://code4fukui.github.io/three.js/build/three.module.js";

// Based on http://www.openprocessing.org/visuals/?visualID=6910
export class Boid {
  constructor (options) {
    let vector = new THREE.Vector3();
    let _acceleration;
    let _width = options.width ?? 500;
    let _height = options.height ?? 500;
    let _depth = options.depth ?? 200;
    let  _goal;
    let _neighborhoodRadius = options.neighborhoodRadius ?? 100;
    let _maxSpeed = options.maxSpeed ?? 2.5;
    let _maxSteerForce = options.maxSteerForce ?? 0.1;
    let _avoidWalls = options.avoidWalls ?? true;

    var _options = options

    this.position = new THREE.Vector3()
    this.velocity = new THREE.Vector3()
    _acceleration = new THREE.Vector3()

    this.setGoal = function ( target ) {
      _goal = target;
    }

    // this.setAvoidWalls = function ( value ) {
    //   _avoidWalls = value;
    // }

    this.setWorldSize = function ( width, height, depth ) {
      _width = width;
      _height = height;vector
      _depth = depth;
    }

    this.run = function ( boids ) {
      if ( _avoidWalls ) {
        vector.set( - _width, this.position.y, this.position.z )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )

        vector.set( _width, this.position.y, this.position.z )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )

        vector.set( this.position.x, - _height, this.position.z )
        //vector.set( this.position.x, 0, this.position.z )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )

        vector.set( this.position.x, _height, this.position.z )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )

        vector.set( this.position.x, this.position.y, - _depth )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )

        vector.set( this.position.x, this.position.y, _depth )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )
      } else {
        this.checkBounds();
      }

      if ( Math.random() > 0.5 ) {
        this.flock( boids )
      }
      this.move()
    }

    this.flock = function ( boids ) {
      if ( _goal ) {
        _acceleration.add( this.reach( _goal, 0.005 ) )
      }
      _acceleration.add( this.alignment( boids ) )
      _acceleration.add( this.cohesion( boids ) )
      _acceleration.add( this.separation( boids ) )
    }

    this.move = function () {
      this.velocity.add( _acceleration )
      var l = this.velocity.length()
      if ( l > _maxSpeed ) {
        this.velocity.divideScalar( l / _maxSpeed )
      }
      this.position.add( this.velocity )
      _acceleration.set( 0, 0, 0 )
    }

    this.checkBounds = function () {
      if ( this.position.x >   _width ) this.position.x = - _width;
      if ( this.position.x < - _width ) this.position.x =   _width;
      if ( this.position.y >   _height ) this.position.y = - _height;
      if ( this.position.y < - _height ) this.position.y =  _height;
      if ( this.position.z >  _depth ) this.position.z = - _depth;
      if ( this.position.z < - _depth ) this.position.z =  _depth;
    }

    this.avoid = function (target) {
      const steer = new THREE.Vector3();
      steer.copy(this.position);
      steer.sub(target);
      steer.multiplyScalar(1 / this.position.distanceToSquared(target));
      return steer
    }

    this.repulse = function ( target, thdistance = 150) {
      const distance = this.position.distanceTo( target )
      if ( distance < thdistance ) {
        const steer = new THREE.Vector3()
        steer.subVectors( this.position, target )
        steer.multiplyScalar( 0.5 / distance )
        _acceleration.add( steer )
      }
    }

    this.reach = function ( target, amount ) {
      var steer = new THREE.Vector3()
      steer.subVectors( target, this.position )
      steer.multiplyScalar( amount )
      return steer
    }

    this.alignment = function ( boids ) {
      var boid, velSum = new THREE.Vector3(), count = 0, distance
      const radius = _neighborhoodRadius * _options.alignment/20
      for ( var i = 0, il = boids.length; i < il; i++ ) {
        if ( Math.random() > 0.6 ) continue
        boid = boids[ i ]
        distance = boid.position.distanceTo( this.position )
        if ( distance > 0 && distance <= radius ) {
          velSum.add( boid.velocity )
          count++
        }
      }
      if ( count > 0 ) {
        velSum.divideScalar( count )
        var l = velSum.length()
        if ( l > _maxSteerForce ) {
          velSum.divideScalar( l / _maxSteerForce )
        }
      }
      return velSum
    }

    this.cohesion = function ( boids ) {
      var boid, distance,
      posSum = new THREE.Vector3(),
      steer = new THREE.Vector3(),
      count = 0
      const radius = _neighborhoodRadius * _options.cohesion/20

      for ( var i = 0, il = boids.length; i < il; i ++ ) {
        if ( Math.random() > 0.6 ) continue
        boid = boids[ i ]
        distance = boid.position.distanceTo( this.position )

        if ( distance > 0 && distance <= radius ) {
          posSum.add( boid.position )
          count++
        }
      }
      if ( count > 0 ) {
        posSum.divideScalar( count )
      }
      steer.subVectors( posSum, this.position )
      var l = steer.length()
      if ( l > _maxSteerForce ) {
        steer.divideScalar( l / _maxSteerForce )
      }
      return steer
    }

    this.separation = function ( boids ) {
      const posSum = new THREE.Vector3();
      const repulse = new THREE.Vector3();
      const radius = _neighborhoodRadius * _options.separation / 20;

      for (let i = 0, il = boids.length; i < il; i++) {
        if (Math.random() > 0.6) continue
        const boid = boids[i];
        const distance = boid.position.distanceTo( this.position )
        if ( distance > 0 && distance <= radius ) {
          repulse.subVectors( this.position, boid.position )
          repulse.normalize()
          repulse.divideScalar( distance )
          posSum.add( repulse )
        }
      }
      return posSum
    }
  }
}