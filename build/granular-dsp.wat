(module
 (type $0 (func (param i32)))
 (type $1 (func (result i32)))
 (type $2 (func))
 (type $3 (func (param i64) (result i32)))
 (type $4 (func (param f64) (result f64)))
 (type $5 (func (param i32 i32 i32)))
 (type $6 (func (param i32 f64 f64 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 i32 f32 f32 i32 i32)))
 (type $7 (func (param f32 f32) (result f32)))
 (type $8 (func (result f32)))
 (type $9 (func (param i32 f64)))
 (type $10 (func (param f64 f64 i32) (result i32)))
 (type $11 (func (param i32 i32) (result i32)))
 (import "env" "memory" (memory $0 64 256))
 (global $assembly/granular-dsp/activeVoiceCount (mut i32) (i32.const 0))
 (global $assembly/granular-dsp/activeNoteCount (mut i32) (i32.const 0))
 (global $assembly/granular-dsp/rngState (mut i32) (i32.const -889275714))
 (global $assembly/granular-dsp/grainCount (mut i32) (i32.const 0))
 (global $~lib/math/rempio2_y0 (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y1 (mut f64) (f64.const 0))
 (global $~lib/math/res128_hi (mut i64) (i64.const 0))
 (data $0 (i32.const 1024) "n\83\f9\a2\00\00\00\00\d1W\'\fc)\15DN\99\95b\db\c0\dd4\f5\abcQ\feA\90C<:n$\b7a\c5\bb\de\ea.I\06\e0\d2MB\1c\eb\1d\fe\1c\92\d1\t\f55\82\e8>\a7)\b1&p\9c\e9\84D\bb.9\d6\919A~_\b4\8b_\84\9c\f49S\83\ff\97\f8\1f;(\f9\bd\8b\11/\ef\0f\98\05\de\cf~6m\1fm\nZf?FO\b7\t\cb\'\c7\ba\'u-\ea_\9e\f79\07={\f1\e5\eb\b1_\fbk\ea\92R\8aF0\03V\08]\8d\1f \bc\cf\f0\abk{\fca\91\e3\a9\1d6\f4\9a_\85\99e\08\1b\e6^\80\d8\ff\8d@h\a0\14W\15\06\061\'sM")
 (export "init" (func $assembly/granular-dsp/init))
 (export "setSafetyLimit" (func $assembly/granular-dsp/setSafetyLimit))
 (export "setTrackBuffer" (func $assembly/granular-dsp/setTrackBuffer))
 (export "pushNote" (func $assembly/granular-dsp/pushNote))
 (export "process" (func $assembly/granular-dsp/process))
 (export "stopAll" (func $assembly/granular-dsp/stopAll))
 (export "stopTrack" (func $assembly/granular-dsp/stopTrack))
 (export "getGrainCount" (func $assembly/granular-dsp/getGrainCount))
 (export "getOutputBase" (func $assembly/granular-dsp/getOutputBase))
 (export "getTrackBuffersBase" (func $assembly/granular-dsp/getTrackBuffersBase))
 (export "allocateTrackBuffer" (func $assembly/granular-dsp/allocateTrackBuffer))
 (export "memory" (memory $0))
 (func $~lib/math/pio2_large_quot (param $0 i64) (result i32)
  (local $1 i64)
  (local $2 i64)
  (local $3 i64)
  (local $4 i32)
  (local $5 f64)
  (local $6 i64)
  (local $7 i64)
  (local $8 i64)
  (local $9 i64)
  (local $10 i64)
  (local $11 i64)
  (local $12 i64)
  local.get $0
  i64.const 9223372036854775807
  i64.and
  i64.const 52
  i64.shr_u
  i64.const 1045
  i64.sub
  local.tee $1
  i64.const 63
  i64.and
  local.set $6
  local.get $1
  i64.const 6
  i64.shr_s
  i32.wrap_i64
  i32.const 3
  i32.shl
  i32.const 1024
  i32.add
  local.tee $4
  i64.load
  local.set $3
  local.get $4
  i64.load offset=8
  local.set $2
  local.get $4
  i64.load offset=16
  local.set $1
  local.get $6
  i64.const 0
  i64.ne
  if
   local.get $3
   local.get $6
   i64.shl
   local.get $2
   i64.const 64
   local.get $6
   i64.sub
   local.tee $7
   i64.shr_u
   i64.or
   local.set $3
   local.get $2
   local.get $6
   i64.shl
   local.get $1
   local.get $7
   i64.shr_u
   i64.or
   local.set $2
   local.get $1
   local.get $6
   i64.shl
   local.get $4
   i64.load offset=24
   local.get $7
   i64.shr_u
   i64.or
   local.set $1
  end
  local.get $0
  i64.const 4503599627370495
  i64.and
  i64.const 4503599627370496
  i64.or
  local.tee $6
  i64.const 4294967295
  i64.and
  local.set $7
  local.get $2
  i64.const 4294967295
  i64.and
  local.tee $8
  local.get $6
  i64.const 32
  i64.shr_u
  local.tee $9
  i64.mul
  local.get $2
  i64.const 32
  i64.shr_u
  local.tee $2
  local.get $7
  i64.mul
  local.get $7
  local.get $8
  i64.mul
  local.tee $7
  i64.const 32
  i64.shr_u
  i64.add
  local.tee $8
  i64.const 4294967295
  i64.and
  i64.add
  local.set $10
  local.get $2
  local.get $9
  i64.mul
  local.get $8
  i64.const 32
  i64.shr_u
  i64.add
  local.get $10
  i64.const 32
  i64.shr_u
  i64.add
  global.set $~lib/math/res128_hi
  local.get $9
  local.get $1
  i64.const 32
  i64.shr_u
  i64.mul
  local.tee $1
  local.get $7
  i64.const 4294967295
  i64.and
  local.get $10
  i64.const 32
  i64.shl
  i64.add
  i64.add
  local.tee $2
  local.get $1
  i64.lt_u
  i64.extend_i32_u
  global.get $~lib/math/res128_hi
  local.get $3
  local.get $6
  i64.mul
  i64.add
  i64.add
  local.tee $3
  i64.const 2
  i64.shl
  local.get $2
  i64.const 62
  i64.shr_u
  i64.or
  local.tee $6
  i64.const 63
  i64.shr_s
  local.tee $7
  local.get $2
  i64.const 2
  i64.shl
  i64.xor
  local.set $2
  local.get $6
  local.get $7
  i64.const 1
  i64.shr_s
  i64.xor
  local.tee $1
  i64.clz
  local.set $8
  local.get $1
  local.get $8
  i64.shl
  local.get $2
  i64.const 64
  local.get $8
  i64.sub
  i64.shr_u
  i64.or
  local.tee $9
  i64.const 4294967295
  i64.and
  local.set $1
  local.get $9
  i64.const 32
  i64.shr_u
  local.tee $10
  i64.const 560513588
  i64.mul
  local.get $1
  i64.const 3373259426
  i64.mul
  local.get $1
  i64.const 560513588
  i64.mul
  local.tee $11
  i64.const 32
  i64.shr_u
  i64.add
  local.tee $12
  i64.const 4294967295
  i64.and
  i64.add
  local.set $1
  local.get $10
  i64.const 3373259426
  i64.mul
  local.get $12
  i64.const 32
  i64.shr_u
  i64.add
  local.get $1
  i64.const 32
  i64.shr_u
  i64.add
  global.set $~lib/math/res128_hi
  local.get $9
  f64.convert_i64_u
  f64.const 3.753184150245214e-04
  f64.mul
  local.get $2
  local.get $8
  i64.shl
  f64.convert_i64_u
  f64.const 3.834951969714103e-04
  f64.mul
  f64.add
  i64.trunc_sat_f64_u
  local.tee $2
  local.get $11
  i64.const 4294967295
  i64.and
  local.get $1
  i64.const 32
  i64.shl
  i64.add
  local.tee $1
  i64.gt_u
  i64.extend_i32_u
  global.get $~lib/math/res128_hi
  local.tee $9
  i64.const 11
  i64.shr_u
  i64.add
  f64.convert_i64_u
  global.set $~lib/math/rempio2_y0
  local.get $9
  i64.const 53
  i64.shl
  local.get $1
  i64.const 11
  i64.shr_u
  i64.or
  local.get $2
  i64.add
  f64.convert_i64_u
  f64.const 5.421010862427522e-20
  f64.mul
  global.set $~lib/math/rempio2_y1
  global.get $~lib/math/rempio2_y0
  i64.const 4372995238176751616
  local.get $8
  i64.const 52
  i64.shl
  i64.sub
  local.get $0
  local.get $6
  i64.xor
  i64.const -9223372036854775808
  i64.and
  i64.or
  f64.reinterpret_i64
  local.tee $5
  f64.mul
  global.set $~lib/math/rempio2_y0
  global.get $~lib/math/rempio2_y1
  local.get $5
  f64.mul
  global.set $~lib/math/rempio2_y1
  local.get $3
  i64.const 62
  i64.shr_s
  local.get $7
  i64.sub
  i32.wrap_i64
 )
 (func $~lib/math/NativeMath.cos (param $0 f64) (result f64)
  (local $1 f64)
  (local $2 f64)
  (local $3 i32)
  (local $4 i64)
  (local $5 i32)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  local.get $0
  i64.reinterpret_f64
  local.tee $4
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $5
  i32.const 31
  i32.shr_u
  local.set $3
  local.get $5
  i32.const 2147483647
  i32.and
  local.tee $5
  i32.const 1072243195
  i32.le_u
  if
   local.get $5
   i32.const 1044816030
   i32.lt_u
   if
    f64.const 1
    return
   end
   local.get $0
   local.get $0
   f64.mul
   local.tee $1
   local.get $1
   f64.mul
   local.set $2
   f64.const 1
   local.get $1
   f64.const 0.5
   f64.mul
   local.tee $6
   f64.sub
   local.tee $7
   f64.const 1
   local.get $7
   f64.sub
   local.get $6
   f64.sub
   local.get $1
   local.get $1
   local.get $1
   local.get $1
   f64.const 2.480158728947673e-05
   f64.mul
   f64.const -0.001388888888887411
   f64.add
   f64.mul
   f64.const 0.0416666666666666
   f64.add
   f64.mul
   local.get $2
   local.get $2
   f64.mul
   local.get $1
   local.get $1
   f64.const -1.1359647557788195e-11
   f64.mul
   f64.const 2.087572321298175e-09
   f64.add
   f64.mul
   f64.const -2.7557314351390663e-07
   f64.add
   f64.mul
   f64.add
   f64.mul
   local.get $0
   f64.const 0
   f64.mul
   f64.sub
   f64.add
   f64.add
   return
  end
  local.get $5
  i32.const 2146435072
  i32.ge_u
  if
   local.get $0
   local.get $0
   f64.sub
   return
  end
  block $~lib/math/rempio2|inlined.0 (result i32)
   local.get $4
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   i32.const 2147483647
   i32.and
   local.tee $5
   i32.const 1094263291
   i32.lt_u
   if
    local.get $5
    i32.const 20
    i32.shr_u
    local.tee $3
    local.get $0
    local.get $0
    f64.const 0.6366197723675814
    f64.mul
    f64.nearest
    local.tee $6
    f64.const 1.5707963267341256
    f64.mul
    f64.sub
    local.tee $0
    local.get $6
    f64.const 6.077100506506192e-11
    f64.mul
    local.tee $2
    f64.sub
    local.tee $1
    i64.reinterpret_f64
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    i32.const 20
    i32.shr_u
    i32.const 2047
    i32.and
    i32.sub
    i32.const 16
    i32.gt_u
    if
     local.get $6
     f64.const 2.0222662487959506e-21
     f64.mul
     local.get $0
     local.get $0
     local.get $6
     f64.const 6.077100506303966e-11
     f64.mul
     local.tee $1
     f64.sub
     local.tee $0
     f64.sub
     local.get $1
     f64.sub
     f64.sub
     local.set $2
     local.get $3
     local.get $0
     local.get $2
     f64.sub
     local.tee $1
     i64.reinterpret_f64
     i64.const 32
     i64.shr_u
     i32.wrap_i64
     i32.const 20
     i32.shr_u
     i32.const 2047
     i32.and
     i32.sub
     i32.const 49
     i32.gt_u
     if
      local.get $6
      f64.const 8.4784276603689e-32
      f64.mul
      local.get $0
      local.get $0
      local.get $6
      f64.const 2.0222662487111665e-21
      f64.mul
      local.tee $1
      f64.sub
      local.tee $0
      f64.sub
      local.get $1
      f64.sub
      f64.sub
      local.set $2
      local.get $0
      local.get $2
      f64.sub
      local.set $1
     end
    end
    local.get $1
    global.set $~lib/math/rempio2_y0
    local.get $0
    local.get $1
    f64.sub
    local.get $2
    f64.sub
    global.set $~lib/math/rempio2_y1
    local.get $6
    i32.trunc_sat_f64_s
    br $~lib/math/rempio2|inlined.0
   end
   i32.const 0
   local.get $4
   call $~lib/math/pio2_large_quot
   local.tee $5
   i32.sub
   local.get $5
   local.get $3
   select
  end
  local.set $3
  global.get $~lib/math/rempio2_y0
  local.set $1
  global.get $~lib/math/rempio2_y1
  local.set $2
  local.get $3
  i32.const 1
  i32.and
  if (result f64)
   local.get $1
   local.get $1
   f64.mul
   local.tee $0
   local.get $1
   f64.mul
   local.set $6
   local.get $1
   local.get $0
   local.get $2
   f64.const 0.5
   f64.mul
   local.get $6
   local.get $0
   local.get $0
   f64.const 2.7557313707070068e-06
   f64.mul
   f64.const -1.984126982985795e-04
   f64.add
   f64.mul
   f64.const 0.00833333333332249
   f64.add
   local.get $0
   local.get $0
   local.get $0
   f64.mul
   f64.mul
   local.get $0
   f64.const 1.58969099521155e-10
   f64.mul
   f64.const -2.5050760253406863e-08
   f64.add
   f64.mul
   f64.add
   f64.mul
   f64.sub
   f64.mul
   local.get $2
   f64.sub
   local.get $6
   f64.const -0.16666666666666632
   f64.mul
   f64.sub
   f64.sub
  else
   local.get $1
   local.get $1
   f64.mul
   local.tee $0
   local.get $0
   f64.mul
   local.set $6
   f64.const 1
   local.get $0
   f64.const 0.5
   f64.mul
   local.tee $7
   f64.sub
   local.tee $8
   f64.const 1
   local.get $8
   f64.sub
   local.get $7
   f64.sub
   local.get $0
   local.get $0
   local.get $0
   local.get $0
   f64.const 2.480158728947673e-05
   f64.mul
   f64.const -0.001388888888887411
   f64.add
   f64.mul
   f64.const 0.0416666666666666
   f64.add
   f64.mul
   local.get $6
   local.get $6
   f64.mul
   local.get $0
   local.get $0
   f64.const -1.1359647557788195e-11
   f64.mul
   f64.const 2.087572321298175e-09
   f64.add
   f64.mul
   f64.const -2.7557314351390663e-07
   f64.add
   f64.mul
   f64.add
   f64.mul
   local.get $1
   local.get $2
   f64.mul
   f64.sub
   f64.add
   f64.add
  end
  local.tee $0
  f64.neg
  local.get $0
  local.get $3
  i32.const 1
  i32.add
  i32.const 2
  i32.and
  select
 )
 (func $assembly/granular-dsp/init
  (local $0 i32)
  loop $for-loop|0
   local.get $0
   i32.const 4096
   i32.lt_s
   if
    local.get $0
    i32.const 2
    i32.shl
    f64.const 1
    local.get $0
    f32.convert_i32_s
    f32.const 4095
    f32.div
    f64.promote_f32
    f64.const 6.28318530717958
    f64.mul
    call $~lib/math/NativeMath.cos
    f64.sub
    f64.const 0.5
    f64.mul
    f32.demote_f64
    f32.store
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
  i32.const 0
  local.set $0
  loop $for-loop|1
   local.get $0
   i32.const 64
   i32.lt_s
   if
    local.get $0
    i32.const 6
    i32.shl
    i32.const 16384
    i32.add
    i32.const 0
    i32.store
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|1
   end
  end
  i32.const 0
  global.set $assembly/granular-dsp/activeVoiceCount
  i32.const 0
  global.set $assembly/granular-dsp/activeNoteCount
  i32.const 0
  global.set $assembly/granular-dsp/grainCount
 )
 (func $assembly/granular-dsp/setSafetyLimit (param $0 i32)
 )
 (func $assembly/granular-dsp/setTrackBuffer (param $0 i32) (param $1 i32) (param $2 i32)
  local.get $0
  i32.const 0
  i32.lt_s
  local.get $0
  i32.const 32
  i32.ge_s
  i32.or
  if
   return
  end
  local.get $0
  i32.const 3
  i32.shl
  i32.const 20736
  i32.add
  local.tee $0
  local.get $1
  i32.store
  local.get $0
  local.get $2
  i32.store offset=4
 )
 (func $assembly/granular-dsp/pushNote (param $0 i32) (param $1 f64) (param $2 f64) (param $3 f32) (param $4 f32) (param $5 f32) (param $6 f32) (param $7 f32) (param $8 f32) (param $9 f32) (param $10 f32) (param $11 f32) (param $12 f32) (param $13 i32) (param $14 f32) (param $15 f32) (param $16 i32) (param $17 i32)
  (local $18 i32)
  global.get $assembly/granular-dsp/activeNoteCount
  i32.const 64
  i32.ge_s
  if
   return
  end
  global.get $assembly/granular-dsp/activeNoteCount
  i32.const 96
  i32.mul
  i32.const 53760
  i32.add
  local.tee $18
  local.get $0
  i32.store
  local.get $18
  local.get $1
  f64.store offset=4
  local.get $18
  local.get $2
  f64.store offset=12
  local.get $18
  local.get $1
  f64.store offset=20
  local.get $18
  local.get $3
  f32.store offset=28
  local.get $18
  local.get $4
  f32.store offset=32
  local.get $18
  local.get $5
  f32.store offset=36
  local.get $18
  local.get $6
  f32.store offset=40
  local.get $18
  local.get $7
  f32.store offset=44
  local.get $18
  local.get $8
  f32.store offset=48
  local.get $18
  local.get $9
  f32.store offset=52
  local.get $18
  local.get $10
  f32.store offset=56
  local.get $18
  local.get $11
  f32.store offset=60
  local.get $18
  i32.const -64
  i32.sub
  local.get $12
  f32.store
  local.get $18
  local.get $13
  i32.store offset=68
  local.get $18
  local.get $14
  f32.store offset=72
  local.get $18
  local.get $15
  f32.store offset=76
  local.get $18
  local.get $16
  i32.store offset=80
  local.get $18
  local.get $17
  i32.store offset=84
  global.get $assembly/granular-dsp/activeNoteCount
  i32.const 1
  i32.add
  global.set $assembly/granular-dsp/activeNoteCount
 )
 (func $~lib/math/NativeMathf.mod (param $0 f32) (param $1 f32) (result f32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  local.get $1
  f32.abs
  f32.const 1
  f32.eq
  if
   local.get $0
   local.get $0
   f32.trunc
   f32.sub
   local.get $0
   f32.copysign
   return
  end
  local.get $1
  i32.reinterpret_f32
  local.tee $6
  i32.const 23
  i32.shr_u
  i32.const 255
  i32.and
  local.set $7
  local.get $6
  i32.const 1
  i32.shl
  local.tee $4
  i32.eqz
  local.get $0
  i32.reinterpret_f32
  local.tee $3
  i32.const 23
  i32.shr_u
  i32.const 255
  i32.and
  local.tee $8
  i32.const 255
  i32.eq
  i32.or
  local.get $1
  local.get $1
  f32.ne
  i32.or
  if
   local.get $0
   local.get $1
   f32.mul
   local.tee $0
   local.get $0
   f32.div
   return
  end
  local.get $3
  i32.const 1
  i32.shl
  local.tee $2
  local.get $4
  i32.le_u
  if
   local.get $0
   local.get $2
   local.get $4
   i32.ne
   f32.convert_i32_u
   f32.mul
   return
  end
  local.get $3
  i32.const -2147483648
  i32.and
  local.get $8
  if (result i32)
   local.get $3
   i32.const 8388607
   i32.and
   i32.const 8388608
   i32.or
  else
   local.get $3
   i32.const 1
   local.get $8
   local.get $3
   i32.const 9
   i32.shl
   i32.clz
   i32.sub
   local.tee $8
   i32.sub
   i32.shl
  end
  local.set $2
  local.get $7
  if (result i32)
   local.get $6
   i32.const 8388607
   i32.and
   i32.const 8388608
   i32.or
  else
   local.get $6
   i32.const 1
   local.get $7
   local.get $6
   i32.const 9
   i32.shl
   i32.clz
   i32.sub
   local.tee $7
   i32.sub
   i32.shl
  end
  local.set $3
  loop $while-continue|0
   local.get $7
   local.get $8
   i32.lt_s
   if
    local.get $2
    local.get $3
    i32.ge_u
    if (result i32)
     local.get $2
     local.get $3
     i32.eq
     if
      local.get $0
      f32.const 0
      f32.mul
      return
     end
     local.get $2
     local.get $3
     i32.sub
    else
     local.get $2
    end
    i32.const 1
    i32.shl
    local.set $2
    local.get $8
    i32.const 1
    i32.sub
    local.set $8
    br $while-continue|0
   end
  end
  local.get $2
  local.get $3
  i32.ge_u
  if
   local.get $2
   local.get $3
   i32.eq
   if
    local.get $0
    f32.const 0
    f32.mul
    return
   end
   local.get $2
   local.get $3
   i32.sub
   local.set $2
  end
  local.get $8
  local.get $2
  i32.const 8
  i32.shl
  i32.clz
  local.tee $4
  i32.sub
  local.set $3
  local.get $2
  local.get $4
  i32.shl
  local.tee $2
  i32.const 8388608
  i32.sub
  local.get $3
  i32.const 23
  i32.shl
  i32.or
  local.get $2
  i32.const 1
  local.get $3
  i32.sub
  i32.shr_u
  local.get $3
  i32.const 0
  i32.gt_s
  select
  i32.or
  f32.reinterpret_i32
 )
 (func $assembly/granular-dsp/xorshift (result f32)
  global.get $assembly/granular-dsp/rngState
  global.get $assembly/granular-dsp/rngState
  i32.const 13
  i32.shl
  i32.xor
  global.set $assembly/granular-dsp/rngState
  global.get $assembly/granular-dsp/rngState
  global.get $assembly/granular-dsp/rngState
  i32.const 17
  i32.shr_u
  i32.xor
  global.set $assembly/granular-dsp/rngState
  global.get $assembly/granular-dsp/rngState
  global.get $assembly/granular-dsp/rngState
  i32.const 5
  i32.shl
  i32.xor
  global.set $assembly/granular-dsp/rngState
  global.get $assembly/granular-dsp/rngState
  f32.convert_i32_u
  f32.const 2.3283064365386963e-10
  f32.mul
 )
 (func $assembly/granular-dsp/spawnGrain (param $0 i32) (param $1 f64)
  (local $2 f32)
  (local $3 f32)
  (local $4 i32)
  (local $5 f32)
  (local $6 f32)
  (local $7 f32)
  (local $8 i32)
  (local $9 i32)
  (local $10 f32)
  (local $11 f32)
  (local $12 f32)
  (local $13 f32)
  (local $14 f32)
  (local $15 i32)
  (local $16 i32)
  local.get $0
  i32.load
  local.tee $8
  i32.const 3
  i32.shl
  local.tee $15
  i32.const 20736
  i32.add
  i32.load
  local.set $9
  local.get $15
  i32.const 20740
  i32.add
  i32.load
  local.tee $15
  i32.const 2
  i32.lt_s
  if
   return
  end
  global.get $assembly/granular-dsp/activeVoiceCount
  i32.const 64
  i32.ge_s
  if
   return
  end
  block $__inlined_func$assembly/granular-dsp/activateVoice$2
   loop $for-loop|0
    local.get $4
    i32.const 64
    i32.lt_s
    if
     local.get $4
     i32.const 6
     i32.shl
     i32.const 16384
     i32.add
     local.tee $16
     i32.load
     i32.eqz
     if
      local.get $16
      i32.const 1
      i32.store
      global.get $assembly/granular-dsp/activeVoiceCount
      i32.const 2
      i32.shl
      i32.const 20480
      i32.add
      local.get $4
      i32.store
      global.get $assembly/granular-dsp/activeVoiceCount
      i32.const 1
      i32.add
      global.set $assembly/granular-dsp/activeVoiceCount
      br $__inlined_func$assembly/granular-dsp/activateVoice$2
     end
     local.get $4
     i32.const 1
     i32.add
     local.set $4
     br $for-loop|0
    end
   end
   i32.const -1
   local.set $4
  end
  local.get $4
  i32.const 0
  i32.lt_s
  if
   return
  end
  local.get $0
  f32.load offset=48
  local.set $10
  local.get $0
  f32.load offset=56
  local.set $11
  local.get $0
  f32.load offset=60
  local.set $12
  local.get $0
  i32.const -64
  i32.sub
  f32.load
  local.set $7
  local.get $0
  i32.load offset=68
  local.set $16
  local.get $0
  f32.load offset=72
  local.set $13
  local.get $0
  f32.load offset=76
  local.set $6
  local.get $0
  f32.load offset=28
  local.get $0
  f32.load offset=32
  f64.promote_f32
  local.get $1
  local.get $0
  f64.load offset=4
  f64.sub
  f64.mul
  f32.demote_f64
  f32.add
  local.set $3
  local.get $0
  f32.load offset=40
  local.tee $14
  local.get $0
  f32.load offset=36
  local.tee $2
  f32.sub
  local.tee $5
  f32.const 9.999999747378752e-05
  f32.gt
  if (result f32)
   local.get $2
   local.get $3
   local.get $2
   f32.sub
   local.get $5
   call $~lib/math/NativeMathf.mod
   local.tee $3
   local.get $5
   f32.add
   local.get $3
   local.get $3
   f32.const 0
   f32.lt
   select
   f32.add
  else
   local.get $2
  end
  local.set $3
  local.get $6
  f32.const 0
  f32.gt
  if (result f32)
   local.get $2
   local.get $3
   call $assembly/granular-dsp/xorshift
   f32.const -0.5
   f32.add
   local.get $6
   f32.mul
   f32.add
   local.tee $2
   f32.gt
   local.get $5
   f32.const 9.999999747378752e-05
   f32.gt
   i32.and
   if
    local.get $2
    local.get $5
    f32.add
    local.set $2
   end
   local.get $2
   local.get $5
   f32.sub
   local.get $2
   local.get $2
   local.get $14
   f32.gt
   local.get $5
   f32.const 9.999999747378752e-05
   f32.gt
   i32.and
   select
  else
   local.get $3
   call $assembly/granular-dsp/xorshift
   f32.const 9.999999747378752e-05
   f32.mul
   f32.add
  end
  local.set $2
  local.get $7
  f32.const 0
  f32.gt
  if
   local.get $2
   call $assembly/granular-dsp/xorshift
   f32.const 2
   f32.mul
   f32.const -1
   f32.add
   local.get $7
   f32.mul
   f32.add
   local.set $2
  end
  local.get $2
  f32.const 0
  f32.lt
  if
   f32.const 0
   local.set $2
  end
  local.get $2
  f32.const 1
  f32.gt
  if
   f32.const 1
   local.set $2
  end
  local.get $4
  i32.const 6
  i32.shl
  i32.const 16384
  i32.add
  local.tee $0
  local.get $8
  i32.store offset=4
  local.get $0
  local.get $9
  i32.store offset=8
  local.get $0
  local.get $15
  i32.store offset=12
  local.get $0
  local.get $2
  f32.store offset=16
  local.get $0
  f32.const 0
  f32.store offset=20
  local.get $0
  local.get $10
  f32.const 44100
  f32.mul
  f64.promote_f32
  f64.const 128
  f64.max
  f32.demote_f64
  local.tee $2
  f32.store offset=24
  local.get $0
  local.get $11
  f32.store offset=28
  local.get $0
  local.get $12
  f32.store offset=32
  local.get $0
  i32.const 0
  i32.store offset=36
  local.get $0
  f32.const 1
  f32.store offset=40
  local.get $0
  f32.const 4095
  local.get $2
  f32.div
  f32.store offset=44
  local.get $0
  local.get $16
  i32.store offset=48
  local.get $0
  local.get $13
  f32.store offset=52
  local.get $0
  local.get $6
  f32.store offset=56
 )
 (func $assembly/granular-dsp/deactivateVoice (param $0 i32)
  (local $1 i32)
  local.get $0
  i32.const 2
  i32.shl
  i32.const 20480
  i32.add
  local.tee $1
  i32.load
  i32.const 6
  i32.shl
  i32.const 16384
  i32.add
  i32.const 0
  i32.store
  global.get $assembly/granular-dsp/activeVoiceCount
  i32.const 1
  i32.sub
  global.set $assembly/granular-dsp/activeVoiceCount
  local.get $0
  global.get $assembly/granular-dsp/activeVoiceCount
  i32.lt_s
  if
   local.get $1
   global.get $assembly/granular-dsp/activeVoiceCount
   i32.const 2
   i32.shl
   i32.const 20480
   i32.add
   i32.load
   i32.store
  end
 )
 (func $assembly/granular-dsp/process (param $0 f64) (param $1 f64) (param $2 i32) (result i32)
  (local $3 i32)
  (local $4 f32)
  (local $5 i32)
  (local $6 f32)
  (local $7 f32)
  (local $8 f32)
  (local $9 f64)
  (local $10 f64)
  (local $11 f32)
  (local $12 f32)
  (local $13 f32)
  (local $14 f32)
  (local $15 f32)
  (local $16 f32)
  (local $17 i32)
  (local $18 i32)
  (local $19 i32)
  (local $20 i32)
  (local $21 i32)
  (local $22 i32)
  (local $23 i32)
  (local $24 i32)
  (local $25 f32)
  (local $26 f32)
  (local $27 i32)
  local.get $2
  f64.convert_i32_s
  local.get $1
  f64.div
  local.set $9
  i32.const 20992
  i32.const 0
  local.get $2
  i32.const 8
  i32.shl
  memory.fill
  global.get $assembly/granular-dsp/activeNoteCount
  i32.const 1
  i32.sub
  local.set $5
  loop $while-continue|0
   local.get $5
   i32.const 0
   i32.ge_s
   if
    local.get $0
    local.get $5
    i32.const 96
    i32.mul
    i32.const 53760
    i32.add
    local.tee $17
    f64.load offset=4
    local.tee $1
    local.get $17
    f64.load offset=12
    f64.add
    f64.gt
    if
     global.get $assembly/granular-dsp/activeNoteCount
     i32.const 1
     i32.sub
     global.set $assembly/granular-dsp/activeNoteCount
     local.get $5
     global.get $assembly/granular-dsp/activeNoteCount
     i32.lt_s
     if
      local.get $17
      global.get $assembly/granular-dsp/activeNoteCount
      i32.const 96
      i32.mul
      i32.const 53760
      i32.add
      i32.const 96
      memory.copy
     end
     local.get $5
     i32.const 1
     i32.sub
     local.set $5
     br $while-continue|0
    end
    local.get $0
    local.get $1
    f64.ge
    if
     local.get $17
     f32.load offset=48
     f64.promote_f32
     local.get $17
     f32.load offset=52
     local.tee $4
     f64.promote_f32
     f64.const 0.1
     f64.max
     f64.div
     f64.const 1
     local.get $17
     f32.load offset=44
     f64.promote_f32
     f64.const 0.1
     f64.max
     f64.div
     local.get $4
     f32.const 0.009999999776482582
     f32.gt
     select
     local.set $10
     local.get $17
     f64.load offset=20
     local.set $1
     i32.const 5
     local.set $3
     loop $while-continue|1
      local.get $3
      i32.const 0
      i32.gt_s
      local.get $1
      local.get $0
      local.get $9
      f64.add
      f64.lt
      i32.and
      if
       global.get $assembly/granular-dsp/activeVoiceCount
       i32.const 64
       i32.lt_s
       local.get $0
       local.get $1
       f64.le
       i32.and
       if
        local.get $17
        local.get $0
        call $assembly/granular-dsp/spawnGrain
       end
       local.get $1
       local.get $10
       f64.add
       local.set $1
       local.get $3
       i32.const 1
       i32.sub
       local.set $3
       br $while-continue|1
      end
     end
     local.get $17
     local.get $1
     f64.store offset=20
    end
    local.get $5
    i32.const 1
    i32.sub
    local.set $5
    br $while-continue|0
   end
  end
  global.get $assembly/granular-dsp/activeVoiceCount
  i32.const 1
  i32.sub
  local.set $5
  loop $while-continue|2
   local.get $5
   i32.const 0
   i32.ge_s
   if
    local.get $5
    i32.const 2
    i32.shl
    i32.const 20480
    i32.add
    i32.load
    i32.const 6
    i32.shl
    i32.const 16384
    i32.add
    local.tee $17
    i32.load offset=4
    local.get $17
    i32.load offset=8
    local.set $18
    local.get $17
    i32.load offset=12
    local.tee $19
    i32.const 2
    i32.lt_s
    if
     local.get $5
     call $assembly/granular-dsp/deactivateVoice
     local.get $5
     i32.const 1
     i32.sub
     local.set $5
     br $while-continue|2
    end
    local.get $17
    f32.load offset=28
    local.set $11
    local.get $17
    f32.load offset=24
    local.set $12
    local.get $17
    f32.load offset=44
    local.set $13
    local.get $17
    f32.load offset=32
    local.set $14
    local.get $17
    f32.load offset=16
    local.get $19
    f32.convert_i32_s
    f32.mul
    local.set $15
    local.get $17
    f32.load offset=52
    local.set $7
    local.get $17
    f32.load offset=20
    local.set $6
    local.get $17
    i32.load offset=36
    local.set $21
    local.get $17
    f32.load offset=40
    local.set $8
    i32.const 1
    i32.shl
    local.get $2
    i32.mul
    i32.const 2
    i32.shl
    i32.const 20992
    i32.add
    local.tee $22
    local.get $2
    i32.const 2
    i32.shl
    i32.add
    local.set $23
    local.get $17
    i32.load offset=48
    local.tee $24
    if (result f32)
     f32.const 1
     global.get $assembly/granular-dsp/activeVoiceCount
     f64.convert_i32_s
     f64.const 1
     f64.max
     f32.demote_f64
     f32.div
    else
     f32.const 1
     global.get $assembly/granular-dsp/activeVoiceCount
     f32.convert_i32_s
     f32.const 0.15000000596046448
     f32.mul
     f32.const 1
     f32.add
     f32.div
    end
    local.set $16
    i32.const 0
    local.set $3
    loop $for-loop|3 (result i32)
     local.get $2
     local.get $3
     i32.gt_s
     if (result i32)
      block $for-break3
       local.get $21
       if
        local.get $8
        f32.const -0.014999999664723873
        f32.add
        local.tee $8
        f32.const 0
        f32.le
        br_if $for-break3
       end
       local.get $6
       local.get $12
       f32.ge
       br_if $for-break3
       local.get $15
       local.get $6
       local.get $11
       f32.mul
       f32.add
       local.set $4
       local.get $19
       f32.convert_i32_s
       local.set $25
       loop $while-continue|4
        local.get $4
        local.get $25
        f32.ge
        if
         local.get $4
         local.get $25
         f32.sub
         local.set $4
         br $while-continue|4
        end
       end
       loop $while-continue|5
        local.get $4
        f32.const 0
        f32.lt
        if
         local.get $4
         local.get $25
         f32.add
         local.set $4
         br $while-continue|5
        end
       end
       local.get $4
       local.get $4
       i32.trunc_sat_f32_s
       local.tee $20
       f32.convert_i32_s
       f32.sub
       local.set $4
       local.get $18
       local.get $20
       i32.const 2
       i32.shl
       i32.add
       f32.load
       local.tee $26
       local.get $24
       i32.eqz
       local.get $7
       f32.const 0
       f32.gt
       i32.and
       if (result f32)
        local.get $7
        local.get $7
        f32.mul
        local.get $7
        f32.mul
        local.get $25
        f32.mul
        f32.const 1
        f32.add
        local.tee $25
        f32.neg
        local.get $4
        local.get $4
        local.get $25
        f32.neg
        f32.lt
        select
        local.get $25
        local.get $4
        local.get $4
        local.get $25
        f32.gt
        select
        local.get $4
        f32.const 0
        f32.lt
        select
       else
        local.get $4
       end
       local.get $18
       local.get $20
       i32.const 1
       i32.add
       local.get $19
       i32.rem_s
       i32.const 2
       i32.shl
       i32.add
       f32.load
       local.get $26
       f32.sub
       f32.mul
       f32.add
       i32.const 4095
       local.get $6
       local.get $13
       f32.mul
       i32.trunc_sat_f32_s
       local.tee $20
       local.get $20
       i32.const 4096
       i32.ge_s
       select
       i32.const 2
       i32.shl
       f32.load
       f32.mul
       local.get $14
       f32.mul
       local.get $8
       f32.mul
       local.get $16
       f32.mul
       local.tee $4
       local.get $4
       f32.eq
       if
        local.get $3
        i32.const 2
        i32.shl
        local.tee $27
        local.get $22
        i32.add
        local.tee $20
        local.get $20
        f32.load
        local.get $4
        f32.add
        f32.store
        local.get $23
        local.get $27
        i32.add
        local.tee $20
        local.get $20
        f32.load
        local.get $4
        f32.add
        f32.store
       end
       local.get $6
       f32.const 1
       f32.add
       local.set $6
       local.get $3
       i32.const 1
       i32.add
       local.set $3
       br $for-loop|3
      end
      local.get $5
      call $assembly/granular-dsp/deactivateVoice
      i32.const 1
     else
      i32.const 0
     end
    end
    i32.eqz
    if
     local.get $17
     local.get $6
     f32.store offset=20
     local.get $17
     local.get $21
     i32.store offset=36
     local.get $17
     local.get $8
     f32.store offset=40
    end
    local.get $5
    i32.const 1
    i32.sub
    local.set $5
    br $while-continue|2
   end
  end
  i32.const 0
  local.set $5
  loop $for-loop|6
   local.get $5
   i32.const 32
   i32.lt_s
   if
    local.get $5
    i32.const 1
    i32.shl
    local.get $2
    i32.mul
    i32.const 2
    i32.shl
    i32.const 20992
    i32.add
    local.tee $17
    local.get $2
    i32.const 2
    i32.shl
    i32.add
    local.set $18
    i32.const 0
    local.set $3
    loop $for-loop|7
     local.get $2
     local.get $3
     i32.gt_s
     if
      local.get $18
      local.get $3
      i32.const 2
      i32.shl
      local.tee $19
      i32.add
      local.tee $20
      f32.load
      local.set $4
      local.get $17
      local.get $19
      i32.add
      local.tee $19
      f32.load
      local.set $6
      local.get $19
      f32.const 0
      local.get $6
      local.get $6
      f32.abs
      f32.const 1
      f32.add
      f32.div
      local.get $6
      local.get $6
      f32.ne
      select
      f32.store
      local.get $20
      f32.const 0
      local.get $4
      local.get $4
      f32.abs
      f32.const 1
      f32.add
      f32.div
      local.get $4
      local.get $4
      f32.ne
      select
      f32.store
      local.get $3
      i32.const 1
      i32.add
      local.set $3
      br $for-loop|7
     end
    end
    local.get $5
    i32.const 1
    i32.add
    local.set $5
    br $for-loop|6
   end
  end
  global.get $assembly/granular-dsp/activeVoiceCount
  global.set $assembly/granular-dsp/grainCount
  global.get $assembly/granular-dsp/activeVoiceCount
 )
 (func $assembly/granular-dsp/stopAll
  (local $0 i32)
  loop $for-loop|0
   local.get $0
   global.get $assembly/granular-dsp/activeVoiceCount
   i32.lt_s
   if
    local.get $0
    i32.const 2
    i32.shl
    i32.const 20480
    i32.add
    i32.load
    i32.const 6
    i32.shl
    i32.const 16384
    i32.add
    i32.const 1
    i32.store offset=36
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
  i32.const 0
  global.set $assembly/granular-dsp/activeNoteCount
 )
 (func $assembly/granular-dsp/stopTrack (param $0 i32)
  (local $1 i32)
  (local $2 i32)
  loop $for-loop|0
   local.get $1
   global.get $assembly/granular-dsp/activeVoiceCount
   i32.lt_s
   if
    local.get $1
    i32.const 2
    i32.shl
    i32.const 20480
    i32.add
    i32.load
    i32.const 6
    i32.shl
    i32.const 16384
    i32.add
    local.tee $2
    i32.load offset=4
    local.get $0
    i32.eq
    if
     local.get $2
     i32.const 1
     i32.store offset=36
    end
    local.get $1
    i32.const 1
    i32.add
    local.set $1
    br $for-loop|0
   end
  end
 )
 (func $assembly/granular-dsp/getGrainCount (result i32)
  global.get $assembly/granular-dsp/grainCount
 )
 (func $assembly/granular-dsp/getOutputBase (result i32)
  i32.const 20992
 )
 (func $assembly/granular-dsp/getTrackBuffersBase (result i32)
  i32.const 59904
 )
 (func $assembly/granular-dsp/allocateTrackBuffer (param $0 i32) (param $1 i32) (result i32)
  local.get $0
  local.get $0
  i32.const 882000
  i32.mul
  i32.const 59904
  i32.add
  local.tee $0
  local.get $1
  call $assembly/granular-dsp/setTrackBuffer
  local.get $0
 )
)
