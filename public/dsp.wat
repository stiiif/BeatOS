(module
 (type $0 (func (param i32 i32) (result i32)))
 (type $1 (func (param i32 i32 i32)))
 (type $2 (func))
 (type $3 (func (param i32) (result i32)))
 (type $4 (func (param f64) (result f64)))
 (type $5 (func (param i32 i32 i32 i32)))
 (type $6 (func (param i64) (result i32)))
 (type $7 (func (param i32 f32 i32 f32 f32 f32 i32)))
 (type $8 (func (param i32 i32)))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $assembly/index/trackBufferPtrs (mut i32) (i32.const 0))
 (global $assembly/index/trackBufferLens (mut i32) (i32.const 0))
 (global $assembly/index/windowLUT (mut i32) (i32.const 0))
 (global $assembly/index/rngState (mut i32) (i32.const -889275714))
 (global $assembly/index/testPhase (mut f32) (f32.const 0))
 (global $assembly/index/voices (mut i32) (i32.const 0))
 (global $assembly/index/freeVoiceIndices (mut i32) (i32.const 0))
 (global $assembly/index/freeVoiceCount (mut i32) (i32.const 0))
 (global $~lib/math/rempio2_y0 (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y1 (mut f64) (f64.const 0))
 (global $~lib/math/res128_hi (mut i64) (i64.const 0))
 (memory $0 1)
 (data $0 (i32.const 1036) ",")
 (data $0.1 (i32.const 1048) "\02\00\00\00\1c\00\00\00I\00n\00v\00a\00l\00i\00d\00 \00l\00e\00n\00g\00t\00h")
 (data $1 (i32.const 1084) "<")
 (data $1.1 (i32.const 1096) "\02\00\00\00&\00\00\00~\00l\00i\00b\00/\00s\00t\00a\00t\00i\00c\00a\00r\00r\00a\00y\00.\00t\00s")
 (data $2 (i32.const 1148) "<")
 (data $2.1 (i32.const 1160) "\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e")
 (data $3 (i32.const 1212) "<")
 (data $3.1 (i32.const 1224) "\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s")
 (data $4 (i32.const 1276) "<")
 (data $4.1 (i32.const 1288) "\02\00\00\00&\00\00\00~\00l\00i\00b\00/\00a\00r\00r\00a\00y\00b\00u\00f\00f\00e\00r\00.\00t\00s")
 (data $5 (i32.const 1340) "<")
 (data $5.1 (i32.const 1352) "\02\00\00\00$\00\00\00I\00n\00d\00e\00x\00 \00o\00u\00t\00 \00o\00f\00 \00r\00a\00n\00g\00e")
 (data $6 (i32.const 1404) "<")
 (data $6.1 (i32.const 1416) "\02\00\00\00$\00\00\00~\00l\00i\00b\00/\00t\00y\00p\00e\00d\00a\00r\00r\00a\00y\00.\00t\00s")
 (data $7 (i32.const 1472) "n\83\f9\a2\00\00\00\00\d1W\'\fc)\15DN\99\95b\db\c0\dd4\f5\abcQ\feA\90C<:n$\b7a\c5\bb\de\ea.I\06\e0\d2MB\1c\eb\1d\fe\1c\92\d1\t\f55\82\e8>\a7)\b1&p\9c\e9\84D\bb.9\d6\919A~_\b4\8b_\84\9c\f49S\83\ff\97\f8\1f;(\f9\bd\8b\11/\ef\0f\98\05\de\cf~6m\1fm\nZf?FO\b7\t\cb\'\c7\ba\'u-\ea_\9e\f79\07={\f1\e5\eb\b1_\fbk\ea\92R\8aF0\03V\08]\8d\1f \bc\cf\f0\abk{\fca\91\e3\a9\1d6\f4\9a_\85\99e\08\1b\e6^\80\d8\ff\8d@h\a0\14W\15\06\061\'sM")
 (data $8 (i32.const 1676) "|")
 (data $8.1 (i32.const 1688) "\02\00\00\00^\00\00\00E\00l\00e\00m\00e\00n\00t\00 \00t\00y\00p\00e\00 \00m\00u\00s\00t\00 \00b\00e\00 \00n\00u\00l\00l\00a\00b\00l\00e\00 \00i\00f\00 \00a\00r\00r\00a\00y\00 \00i\00s\00 \00h\00o\00l\00e\00y")
 (export "init" (func $assembly/index/init))
 (export "allocateBuffer" (func $assembly/index/allocateBuffer))
 (export "setTrackBuffer" (func $assembly/index/setTrackBuffer))
 (export "spawnGrain" (func $assembly/index/spawnGrain))
 (export "process" (func $assembly/index/process))
 (export "stopAll" (func $assembly/index/stopAll))
 (export "memory" (memory $0))
 (start $~start)
 (func $~lib/rt/stub/__alloc (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  local.get $0
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 1168
   i32.const 1232
   i32.const 33
   i32.const 29
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/rt/stub/offset
  global.get $~lib/rt/stub/offset
  i32.const 4
  i32.add
  local.tee $2
  local.get $0
  i32.const 19
  i32.add
  i32.const -16
  i32.and
  i32.const 4
  i32.sub
  local.tee $0
  i32.add
  local.tee $3
  memory.size
  local.tee $4
  i32.const 16
  i32.shl
  i32.const 15
  i32.add
  i32.const -16
  i32.and
  local.tee $5
  i32.gt_u
  if
   local.get $4
   local.get $3
   local.get $5
   i32.sub
   i32.const 65535
   i32.add
   i32.const -65536
   i32.and
   i32.const 16
   i32.shr_u
   local.tee $5
   local.get $4
   local.get $5
   i32.gt_s
   select
   memory.grow
   i32.const 0
   i32.lt_s
   if
    local.get $5
    memory.grow
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
  end
  local.get $3
  global.set $~lib/rt/stub/offset
  local.get $0
  i32.store
  local.get $2
 )
 (func $~lib/rt/stub/__new (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  local.get $0
  i32.const 1073741804
  i32.gt_u
  if
   i32.const 1168
   i32.const 1232
   i32.const 86
   i32.const 30
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 16
  i32.add
  call $~lib/rt/stub/__alloc
  local.tee $3
  i32.const 4
  i32.sub
  local.tee $2
  i32.const 0
  i32.store offset=4
  local.get $2
  i32.const 0
  i32.store offset=8
  local.get $2
  local.get $1
  i32.store offset=12
  local.get $2
  local.get $0
  i32.store offset=16
  local.get $3
  i32.const 16
  i32.add
 )
 (func $~lib/arraybuffer/ArrayBufferView#constructor (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  local.get $0
  i32.eqz
  if
   i32.const 12
   i32.const 3
   call $~lib/rt/stub/__new
   local.set $0
  end
  local.get $0
  i32.const 0
  i32.store
  local.get $0
  i32.const 0
  i32.store offset=4
  local.get $0
  i32.const 0
  i32.store offset=8
  local.get $1
  i32.const 268435455
  i32.gt_u
  if
   i32.const 1056
   i32.const 1296
   i32.const 19
   i32.const 57
   call $~lib/builtins/abort
   unreachable
  end
  local.get $1
  i32.const 2
  i32.shl
  local.tee $1
  i32.const 1
  call $~lib/rt/stub/__new
  local.tee $2
  i32.const 0
  local.get $1
  memory.fill
  local.get $0
  local.get $2
  i32.store
  local.get $0
  local.get $2
  i32.store offset=4
  local.get $0
  local.get $1
  i32.store offset=8
  local.get $0
 )
 (func $~lib/typedarray/Int32Array#__set (param $0 i32) (param $1 i32) (param $2 i32)
  local.get $1
  local.get $0
  i32.load offset=8
  i32.const 2
  i32.shr_u
  i32.ge_u
  if
   i32.const 1360
   i32.const 1424
   i32.const 747
   i32.const 64
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.load offset=4
  local.get $1
  i32.const 2
  i32.shl
  i32.add
  local.get $2
  i32.store
 )
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
  i32.const 1472
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
  (local $4 i32)
  (local $5 i64)
  (local $6 i32)
  (local $7 f64)
  (local $8 f64)
  (local $9 f64)
  local.get $0
  i64.reinterpret_f64
  local.tee $5
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $3
  i32.const 31
  i32.shr_u
  local.set $6
  local.get $3
  i32.const 2147483647
  i32.and
  local.tee $3
  i32.const 1072243195
  i32.le_u
  if
   local.get $3
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
   local.tee $7
   f64.sub
   local.tee $8
   f64.const 1
   local.get $8
   f64.sub
   local.get $7
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
  local.get $3
  i32.const 2146435072
  i32.ge_u
  if
   local.get $0
   local.get $0
   f64.sub
   return
  end
  block $~lib/math/rempio2|inlined.0 (result i32)
   local.get $5
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   i32.const 2147483647
   i32.and
   local.tee $4
   i32.const 1073928572
   i32.lt_u
   if
    i32.const 1
    local.set $3
    local.get $6
    if (result f64)
     local.get $0
     f64.const 1.5707963267341256
     f64.add
     local.set $0
     i32.const -1
     local.set $3
     local.get $4
     i32.const 1073291771
     i32.ne
     if (result f64)
      local.get $0
      local.get $0
      f64.const 6.077100506506192e-11
      f64.add
      local.tee $0
      f64.sub
      f64.const 6.077100506506192e-11
      f64.add
     else
      local.get $0
      f64.const 6.077100506303966e-11
      f64.add
      local.tee $1
      f64.const 2.0222662487959506e-21
      f64.add
      local.set $0
      local.get $1
      local.get $0
      f64.sub
      f64.const 2.0222662487959506e-21
      f64.add
     end
    else
     local.get $0
     f64.const -1.5707963267341256
     f64.add
     local.set $0
     local.get $4
     i32.const 1073291771
     i32.ne
     if (result f64)
      local.get $0
      local.get $0
      f64.const -6.077100506506192e-11
      f64.add
      local.tee $0
      f64.sub
      f64.const -6.077100506506192e-11
      f64.add
     else
      local.get $0
      f64.const -6.077100506303966e-11
      f64.add
      local.tee $1
      f64.const -2.0222662487959506e-21
      f64.add
      local.set $0
      local.get $1
      local.get $0
      f64.sub
      f64.const -2.0222662487959506e-21
      f64.add
     end
    end
    local.get $0
    global.set $~lib/math/rempio2_y0
    global.set $~lib/math/rempio2_y1
    local.get $3
    br $~lib/math/rempio2|inlined.0
   end
   local.get $4
   i32.const 1094263291
   i32.lt_u
   if
    local.get $4
    i32.const 20
    i32.shr_u
    local.tee $3
    local.get $0
    local.get $0
    f64.const 0.6366197723675814
    f64.mul
    f64.nearest
    local.tee $7
    f64.const 1.5707963267341256
    f64.mul
    f64.sub
    local.tee $0
    local.get $7
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
     local.get $7
     f64.const 2.0222662487959506e-21
     f64.mul
     local.get $0
     local.get $0
     local.get $7
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
      local.get $7
      f64.const 8.4784276603689e-32
      f64.mul
      local.get $0
      local.get $0
      local.get $7
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
    local.get $7
    i32.trunc_sat_f64_s
    br $~lib/math/rempio2|inlined.0
   end
   i32.const 0
   local.get $5
   call $~lib/math/pio2_large_quot
   local.tee $3
   i32.sub
   local.get $3
   local.get $6
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
   local.set $7
   local.get $1
   local.get $0
   local.get $2
   f64.const 0.5
   f64.mul
   local.get $7
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
   local.get $7
   f64.const -0.16666666666666632
   f64.mul
   f64.sub
   f64.sub
  else
   local.get $1
   local.get $1
   f64.mul
   local.tee $7
   local.get $7
   f64.mul
   local.set $8
   f64.const 1
   local.get $7
   f64.const 0.5
   f64.mul
   local.tee $0
   f64.sub
   local.tee $9
   f64.const 1
   local.get $9
   f64.sub
   local.get $0
   f64.sub
   local.get $7
   local.get $7
   local.get $7
   local.get $7
   f64.const 2.480158728947673e-05
   f64.mul
   f64.const -0.001388888888887411
   f64.add
   f64.mul
   f64.const 0.0416666666666666
   f64.add
   f64.mul
   local.get $8
   local.get $8
   f64.mul
   local.get $7
   local.get $7
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
 (func $assembly/index/init
  (local $0 i32)
  (local $1 i32)
  (local $2 f32)
  (local $3 i32)
  loop $for-loop|0
   local.get $1
   i32.const 64
   i32.lt_s
   if
    global.get $assembly/index/voices
    local.set $3
    i32.const 52
    i32.const 7
    call $~lib/rt/stub/__new
    local.tee $0
    i32.eqz
    if
     i32.const 0
     i32.const 0
     call $~lib/rt/stub/__new
     local.set $0
    end
    local.get $0
    i32.const 0
    i32.store8
    local.get $0
    i32.const 0
    i32.store offset=4
    local.get $0
    i32.const 0
    i32.store offset=8
    local.get $0
    i32.const 0
    i32.store offset=12
    local.get $0
    f32.const 0
    f32.store offset=16
    local.get $0
    i32.const 0
    i32.store offset=20
    local.get $0
    i32.const 0
    i32.store offset=24
    local.get $0
    f32.const 0
    f32.store offset=28
    local.get $0
    f32.const 1
    f32.store offset=32
    local.get $0
    f32.const 1
    f32.store offset=36
    local.get $0
    i32.const 0
    i32.store8 offset=40
    local.get $0
    f32.const 1
    f32.store offset=44
    local.get $0
    i32.const 0
    i32.store offset=48
    local.get $1
    local.get $3
    i32.const 20
    i32.sub
    i32.load offset=16
    i32.const 2
    i32.shr_u
    i32.ge_u
    if
     i32.const 1360
     i32.const 1104
     i32.const 93
     i32.const 41
     call $~lib/builtins/abort
     unreachable
    end
    local.get $3
    local.get $1
    i32.const 2
    i32.shl
    i32.add
    local.get $0
    i32.store
    global.get $assembly/index/freeVoiceIndices
    local.get $1
    local.get $1
    call $~lib/typedarray/Int32Array#__set
    local.get $1
    i32.const 1
    i32.add
    local.set $1
    br $for-loop|0
   end
  end
  i32.const 0
  local.set $0
  loop $for-loop|1
   local.get $0
   i32.const 4096
   i32.lt_s
   if
    local.get $0
    f32.convert_i32_s
    f32.const 4095
    f32.div
    local.tee $2
    f32.const 0.25
    f32.lt
    if (result f32)
     local.get $2
     f64.promote_f32
     f64.const 2
     f64.mul
     f64.const 2
     f64.mul
     f64.const -1
     f64.add
     f64.const 3.141592653589793
     f64.mul
     call $~lib/math/NativeMath.cos
     f64.const 1
     f64.add
     f64.const 0.5
     f64.mul
     f32.demote_f64
    else
     local.get $2
     f32.const 0.75
     f32.gt
     if (result f32)
      local.get $2
      f64.promote_f32
      f64.const 2
      f64.mul
      f64.const 2
      f64.mul
      f64.const -4
      f64.add
      f64.const 1
      f64.add
      f64.const 3.141592653589793
      f64.mul
      call $~lib/math/NativeMath.cos
      f64.const 1
      f64.add
      f64.const 0.5
      f64.mul
      f32.demote_f64
     else
      f32.const 1
     end
    end
    local.set $2
    local.get $0
    global.get $assembly/index/windowLUT
    local.tee $1
    i32.load offset=8
    i32.const 2
    i32.shr_u
    i32.ge_u
    if
     i32.const 1360
     i32.const 1424
     i32.const 1315
     i32.const 64
     call $~lib/builtins/abort
     unreachable
    end
    local.get $1
    i32.load offset=4
    local.get $0
    i32.const 2
    i32.shl
    i32.add
    local.get $2
    f32.store
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|1
   end
  end
 )
 (func $assembly/index/allocateBuffer (param $0 i32) (result i32)
  local.get $0
  i32.const 2
  i32.shl
  call $~lib/rt/stub/__alloc
 )
 (func $~lib/staticarray/StaticArray<usize>#__set (param $0 i32) (param $1 i32) (param $2 i32)
  local.get $1
  local.get $0
  i32.const 20
  i32.sub
  i32.load offset=16
  i32.const 2
  i32.shr_u
  i32.ge_u
  if
   i32.const 1360
   i32.const 1104
   i32.const 93
   i32.const 41
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  local.get $1
  i32.const 2
  i32.shl
  i32.add
  local.get $2
  i32.store
 )
 (func $assembly/index/setTrackBuffer (param $0 i32) (param $1 i32) (param $2 i32)
  local.get $0
  i32.const 32
  i32.lt_s
  local.get $0
  i32.const 0
  i32.ge_s
  i32.and
  if
   global.get $assembly/index/trackBufferPtrs
   local.get $0
   local.get $1
   call $~lib/staticarray/StaticArray<usize>#__set
   global.get $assembly/index/trackBufferLens
   local.get $0
   local.get $2
   call $~lib/staticarray/StaticArray<usize>#__set
  end
 )
 (func $~lib/staticarray/StaticArray<assembly/index/Voice>#__get (param $0 i32) (param $1 i32) (result i32)
  local.get $1
  local.get $0
  i32.const 20
  i32.sub
  i32.load offset=16
  i32.const 2
  i32.shr_u
  i32.ge_u
  if
   i32.const 1360
   i32.const 1104
   i32.const 78
   i32.const 41
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  local.get $1
  i32.const 2
  i32.shl
  i32.add
  i32.load
  local.tee $0
  i32.eqz
  if
   i32.const 1696
   i32.const 1104
   i32.const 82
   i32.const 40
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
 )
 (func $assembly/index/spawnGrain (param $0 i32) (param $1 f32) (param $2 i32) (param $3 f32) (param $4 f32) (param $5 f32) (param $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  global.get $assembly/index/freeVoiceCount
  i32.const 0
  i32.le_s
  if
   return
  end
  block $folding-inner0
   local.get $0
   global.get $assembly/index/trackBufferPtrs
   local.tee $7
   i32.const 20
   i32.sub
   i32.load offset=16
   i32.const 2
   i32.shr_u
   i32.ge_u
   br_if $folding-inner0
   local.get $7
   local.get $0
   i32.const 2
   i32.shl
   local.tee $7
   i32.add
   i32.load
   local.tee $8
   i32.eqz
   local.get $0
   global.get $assembly/index/trackBufferLens
   local.tee $10
   i32.const 20
   i32.sub
   i32.load offset=16
   i32.const 2
   i32.shr_u
   i32.ge_u
   br_if $folding-inner0
   local.get $7
   local.get $10
   i32.add
   i32.load
   local.tee $7
   i32.const 2
   i32.lt_s
   i32.or
   if
    return
   end
   global.get $assembly/index/freeVoiceCount
   i32.const 1
   i32.sub
   global.set $assembly/index/freeVoiceCount
   global.get $assembly/index/freeVoiceCount
   local.tee $9
   global.get $assembly/index/freeVoiceIndices
   local.tee $10
   i32.load offset=8
   i32.const 2
   i32.shr_u
   i32.ge_u
   if
    i32.const 1360
    i32.const 1424
    i32.const 736
    i32.const 64
    call $~lib/builtins/abort
    unreachable
   end
   global.get $assembly/index/voices
   local.get $10
   i32.load offset=4
   local.get $9
   i32.const 2
   i32.shl
   i32.add
   i32.load
   call $~lib/staticarray/StaticArray<assembly/index/Voice>#__get
   local.set $9
   local.get $5
   f32.const 0
   f32.gt
   if
    global.get $assembly/index/rngState
    global.get $assembly/index/rngState
    i32.const 13
    i32.shl
    i32.xor
    global.set $assembly/index/rngState
    global.get $assembly/index/rngState
    global.get $assembly/index/rngState
    i32.const 17
    i32.shr_u
    i32.xor
    global.set $assembly/index/rngState
    global.get $assembly/index/rngState
    global.get $assembly/index/rngState
    i32.const 5
    i32.shl
    i32.xor
    global.set $assembly/index/rngState
    local.get $1
    global.get $assembly/index/rngState
    f32.convert_i32_u
    f32.const 2.3283064365386963e-10
    f32.mul
    f32.const 2
    f32.mul
    f32.const -1
    f32.add
    local.get $5
    f32.mul
    f32.add
    local.tee $1
    f32.const 0
    f32.lt
    if
     f32.const 0
     local.set $1
    end
    f32.const 1
    local.get $1
    local.get $1
    f32.const 1
    f32.gt
    select
    local.set $1
   end
   local.get $9
   i32.const 1
   i32.store8
   local.get $9
   local.get $0
   i32.store offset=4
   local.get $9
   local.get $8
   i32.store offset=8
   local.get $9
   local.get $7
   i32.store offset=12
   local.get $9
   local.get $1
   local.get $7
   f32.convert_i32_s
   f32.mul
   f32.store offset=16
   local.get $9
   i32.const 0
   i32.store offset=20
   local.get $9
   local.get $2
   i32.store offset=24
   local.get $9
   f32.const 4095
   local.get $2
   f32.convert_i32_s
   f32.div
   f32.store offset=28
   local.get $9
   local.get $3
   f32.store offset=32
   local.get $9
   local.get $4
   f32.store offset=36
   local.get $9
   i32.const 0
   i32.store8 offset=40
   local.get $9
   f32.const 1
   f32.store offset=44
   local.get $9
   local.get $6
   i32.store offset=48
   return
  end
  i32.const 1360
  i32.const 1104
  i32.const 78
  i32.const 41
  call $~lib/builtins/abort
  unreachable
 )
 (func $~lib/math/NativeMath.sin (param $0 f64) (result f64)
  (local $1 f64)
  (local $2 f64)
  (local $3 i32)
  (local $4 i32)
  (local $5 i64)
  (local $6 i32)
  (local $7 f64)
  (local $8 f64)
  (local $9 f64)
  local.get $0
  i64.reinterpret_f64
  local.tee $5
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $3
  i32.const 31
  i32.shr_u
  local.set $6
  local.get $3
  i32.const 2147483647
  i32.and
  local.tee $3
  i32.const 1072243195
  i32.le_u
  if
   local.get $3
   i32.const 1045430272
   i32.lt_u
   if
    local.get $0
    return
   end
   local.get $0
   local.get $0
   local.get $0
   f64.mul
   local.tee $1
   local.get $0
   f64.mul
   local.get $1
   local.get $1
   local.get $1
   f64.const 2.7557313707070068e-06
   f64.mul
   f64.const -1.984126982985795e-04
   f64.add
   f64.mul
   f64.const 0.00833333333332249
   f64.add
   local.get $1
   local.get $1
   local.get $1
   f64.mul
   f64.mul
   local.get $1
   f64.const 1.58969099521155e-10
   f64.mul
   f64.const -2.5050760253406863e-08
   f64.add
   f64.mul
   f64.add
   f64.mul
   f64.const -0.16666666666666632
   f64.add
   f64.mul
   f64.add
   return
  end
  local.get $3
  i32.const 2146435072
  i32.ge_u
  if
   local.get $0
   local.get $0
   f64.sub
   return
  end
  block $~lib/math/rempio2|inlined.1 (result i32)
   local.get $5
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   i32.const 2147483647
   i32.and
   local.tee $4
   i32.const 1073928572
   i32.lt_u
   if
    i32.const 1
    local.set $3
    local.get $6
    if (result f64)
     local.get $0
     f64.const 1.5707963267341256
     f64.add
     local.set $0
     i32.const -1
     local.set $3
     local.get $4
     i32.const 1073291771
     i32.ne
     if (result f64)
      local.get $0
      local.get $0
      f64.const 6.077100506506192e-11
      f64.add
      local.tee $0
      f64.sub
      f64.const 6.077100506506192e-11
      f64.add
     else
      local.get $0
      f64.const 6.077100506303966e-11
      f64.add
      local.tee $1
      f64.const 2.0222662487959506e-21
      f64.add
      local.set $0
      local.get $1
      local.get $0
      f64.sub
      f64.const 2.0222662487959506e-21
      f64.add
     end
    else
     local.get $0
     f64.const -1.5707963267341256
     f64.add
     local.set $0
     local.get $4
     i32.const 1073291771
     i32.ne
     if (result f64)
      local.get $0
      local.get $0
      f64.const -6.077100506506192e-11
      f64.add
      local.tee $0
      f64.sub
      f64.const -6.077100506506192e-11
      f64.add
     else
      local.get $0
      f64.const -6.077100506303966e-11
      f64.add
      local.tee $1
      f64.const -2.0222662487959506e-21
      f64.add
      local.set $0
      local.get $1
      local.get $0
      f64.sub
      f64.const -2.0222662487959506e-21
      f64.add
     end
    end
    local.get $0
    global.set $~lib/math/rempio2_y0
    global.set $~lib/math/rempio2_y1
    local.get $3
    br $~lib/math/rempio2|inlined.1
   end
   local.get $4
   i32.const 1094263291
   i32.lt_u
   if
    local.get $4
    i32.const 20
    i32.shr_u
    local.tee $3
    local.get $0
    local.get $0
    f64.const 0.6366197723675814
    f64.mul
    f64.nearest
    local.tee $7
    f64.const 1.5707963267341256
    f64.mul
    f64.sub
    local.tee $0
    local.get $7
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
     local.get $7
     f64.const 2.0222662487959506e-21
     f64.mul
     local.get $0
     local.get $0
     local.get $7
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
      local.get $7
      f64.const 8.4784276603689e-32
      f64.mul
      local.get $0
      local.get $0
      local.get $7
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
    local.get $7
    i32.trunc_sat_f64_s
    br $~lib/math/rempio2|inlined.1
   end
   i32.const 0
   local.get $5
   call $~lib/math/pio2_large_quot
   local.tee $3
   i32.sub
   local.get $3
   local.get $6
   select
  end
  local.set $3
  global.get $~lib/math/rempio2_y0
  local.set $2
  global.get $~lib/math/rempio2_y1
  local.set $7
  local.get $3
  i32.const 1
  i32.and
  if (result f64)
   local.get $2
   local.get $2
   f64.mul
   local.tee $0
   local.get $0
   f64.mul
   local.set $1
   f64.const 1
   local.get $0
   f64.const 0.5
   f64.mul
   local.tee $8
   f64.sub
   local.tee $9
   f64.const 1
   local.get $9
   f64.sub
   local.get $8
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
   local.get $1
   local.get $1
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
   local.get $2
   local.get $7
   f64.mul
   f64.sub
   f64.add
   f64.add
  else
   local.get $2
   local.get $2
   f64.mul
   local.tee $0
   local.get $2
   f64.mul
   local.set $1
   local.get $2
   local.get $0
   local.get $7
   f64.const 0.5
   f64.mul
   local.get $1
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
   local.get $7
   f64.sub
   local.get $1
   f64.const -0.16666666666666632
   f64.mul
   f64.sub
   f64.sub
  end
  local.tee $0
  f64.neg
  local.get $0
  local.get $3
  i32.const 2
  i32.and
  select
 )
 (func $assembly/index/process (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 f32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 f64)
  (local $8 i32)
  (local $9 i32)
  (local $10 f32)
  (local $11 i32)
  (local $12 f32)
  (local $13 i32)
  (local $14 f32)
  (local $15 i32)
  (local $16 f32)
  loop $for-loop|0
   local.get $1
   local.get $2
   i32.gt_s
   if
    global.get $assembly/index/testPhase
    f32.const 0.06268937885761261
    f32.add
    global.set $assembly/index/testPhase
    global.get $assembly/index/testPhase
    f32.const 6.2831854820251465
    f32.gt
    if
     global.get $assembly/index/testPhase
     f32.const -6.2831854820251465
     f32.add
     global.set $assembly/index/testPhase
    end
    global.get $assembly/index/testPhase
    f64.promote_f32
    call $~lib/math/NativeMath.sin
    f64.const 0.2
    f64.mul
    f32.demote_f64
    local.set $3
    local.get $0
    local.get $2
    i32.const 2
    i32.shl
    i32.add
    local.tee $4
    local.get $4
    f32.load
    local.get $3
    f32.add
    f32.store
    local.get $2
    i32.const 1
    i32.add
    local.set $2
    br $for-loop|0
   end
  end
  loop $for-loop|1
   local.get $6
   i32.const 64
   i32.lt_s
   if
    global.get $assembly/index/voices
    local.get $6
    call $~lib/staticarray/StaticArray<assembly/index/Voice>#__get
    local.tee $13
    i32.load8_u
    if
     local.get $13
     i32.load offset=4
     i32.const 1
     i32.shl
     local.get $1
     i32.mul
     i32.const 2
     i32.shl
     local.get $0
     i32.add
     local.tee $4
     local.set $8
     local.get $13
     f32.load offset=32
     local.tee $3
     f32.const 1.2000000476837158
     f32.gt
     local.tee $2
     i32.eqz
     if
      local.get $3
      f32.const 0.800000011920929
      f32.lt
      local.set $2
     end
     local.get $1
     i32.const 2
     i32.shl
     local.get $4
     i32.add
     local.set $9
     i32.const 0
     local.set $5
     loop $for-loop|2
      local.get $1
      local.get $5
      i32.gt_s
      if
       block $for-break2
        local.get $5
        local.get $13
        i32.load offset=48
        i32.ge_s
        if
         local.get $13
         i32.load8_u offset=40
         if
          local.get $13
          local.get $13
          f32.load offset=44
          f32.const -0.014999999664723873
          f32.add
          f32.store offset=44
          local.get $13
          f32.load offset=44
          f32.const 0
          f32.le
          br_if $for-break2
         end
         local.get $13
         i32.load offset=20
         local.tee $4
         local.get $13
         i32.load offset=24
         i32.ge_s
         br_if $for-break2
         local.get $13
         f32.load offset=16
         local.get $4
         f32.convert_i32_s
         local.get $13
         f32.load offset=32
         f32.mul
         f32.add
         local.tee $3
         i32.trunc_sat_f32_s
         local.set $4
         local.get $13
         i32.load offset=12
         local.set $11
         loop $while-continue|3
          local.get $4
          local.get $11
          i32.ge_s
          if
           local.get $4
           local.get $11
           i32.sub
           local.set $4
           br $while-continue|3
          end
         end
         loop $while-continue|4
          local.get $4
          i32.const 0
          i32.lt_s
          if
           local.get $4
           local.get $13
           i32.load offset=12
           i32.add
           local.set $4
           br $while-continue|4
          end
         end
         local.get $3
         local.get $4
         f32.convert_i32_s
         f32.sub
         local.set $14
         local.get $8
         local.get $5
         i32.const 2
         i32.shl
         i32.add
         local.tee $11
         f32.load
         local.set $3
         local.get $11
         local.get $3
         local.get $2
         if (result f32)
          local.get $4
          i32.const 2
          i32.add
          local.tee $11
          local.get $13
          i32.load offset=12
          local.tee $15
          i32.sub
          local.get $11
          local.get $11
          local.get $15
          i32.ge_s
          select
          i32.const 2
          i32.shl
          local.get $13
          i32.load offset=8
          local.tee $15
          i32.add
          f32.load
          local.tee $10
          local.get $15
          local.get $4
          i32.const 1
          i32.sub
          local.tee $11
          i32.const 0
          i32.lt_s
          if (result i32)
           local.get $11
           local.get $13
           i32.load offset=12
           i32.add
          else
           local.get $11
          end
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.tee $16
          f32.sub
          f64.promote_f32
          f64.const 0.5
          f64.mul
          local.get $15
          local.get $4
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.tee $3
          local.get $15
          local.get $4
          i32.const 1
          i32.add
          local.tee $4
          local.get $13
          i32.load offset=12
          local.tee $11
          i32.ge_s
          if (result i32)
           local.get $4
           local.get $11
           i32.sub
          else
           local.get $4
          end
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.tee $12
          f32.sub
          f64.promote_f32
          f64.const 1.5
          f64.mul
          f64.add
          local.get $14
          f64.promote_f32
          local.tee $7
          f64.mul
          local.get $16
          local.get $3
          f32.const 2.5
          f32.mul
          f32.sub
          local.get $12
          local.get $12
          f32.add
          f32.add
          local.get $10
          f32.const 0.5
          f32.mul
          f32.sub
          f64.promote_f32
          f64.add
          local.get $7
          f64.mul
          local.get $12
          local.get $16
          f32.sub
          f64.promote_f32
          f64.const 0.5
          f64.mul
          f64.add
          local.get $7
          f64.mul
          local.get $3
          f64.promote_f32
          f64.add
          f32.demote_f64
         else
          local.get $13
          i32.load offset=8
          local.tee $11
          local.get $4
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.tee $3
          local.get $14
          local.get $11
          local.get $4
          i32.const 1
          i32.add
          local.tee $4
          i32.const 0
          local.get $4
          local.get $13
          i32.load offset=12
          i32.lt_s
          select
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get $3
          f32.sub
          f32.mul
          f32.add
         end
         global.get $assembly/index/windowLUT
         i32.load offset=4
         i32.const 4095
         local.get $13
         i32.load offset=20
         f32.convert_i32_s
         local.get $13
         f32.load offset=28
         f32.mul
         i32.trunc_sat_f32_s
         local.tee $4
         local.get $4
         i32.const 4096
         i32.ge_s
         select
         i32.const 2
         i32.shl
         i32.add
         f32.load
         f32.mul
         local.get $13
         f32.load offset=36
         f32.mul
         local.get $13
         f32.load offset=44
         f32.mul
         local.tee $3
         f32.add
         f32.store
         local.get $9
         local.get $5
         i32.const 2
         i32.shl
         i32.add
         local.tee $4
         local.get $4
         f32.load
         local.get $3
         f32.add
         f32.store
         local.get $13
         local.get $13
         i32.load offset=20
         i32.const 1
         i32.add
         i32.store offset=20
        end
        local.get $5
        i32.const 1
        i32.add
        local.set $5
        br $for-loop|2
       end
       local.get $13
       i32.const 0
       i32.store8
       global.get $assembly/index/freeVoiceCount
       local.tee $2
       i32.const 1
       i32.add
       global.set $assembly/index/freeVoiceCount
       global.get $assembly/index/freeVoiceIndices
       local.get $2
       local.get $6
       call $~lib/typedarray/Int32Array#__set
      end
     end
     local.get $13
     i32.load8_u
     if
      local.get $13
      local.get $13
      i32.load offset=48
      local.get $1
      i32.sub
      i32.store offset=48
      local.get $13
      i32.load offset=48
      i32.const 0
      i32.lt_s
      if
       local.get $13
       i32.const 0
       i32.store offset=48
      end
     end
    end
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $for-loop|1
   end
  end
 )
 (func $assembly/index/stopAll
  (local $0 i32)
  loop $for-loop|0
   local.get $0
   i32.const 64
   i32.lt_s
   if
    global.get $assembly/index/voices
    local.get $0
    call $~lib/staticarray/StaticArray<assembly/index/Voice>#__get
    i32.load8_u
    if
     global.get $assembly/index/voices
     local.get $0
     call $~lib/staticarray/StaticArray<assembly/index/Voice>#__get
     i32.const 1
     i32.store8 offset=40
    end
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
 )
 (func $~start
  (local $0 i32)
  i32.const 1804
  global.set $~lib/rt/stub/offset
  i32.const 128
  i32.const 4
  call $~lib/rt/stub/__new
  local.tee $0
  i32.const 0
  i32.const 128
  memory.fill
  local.get $0
  global.set $assembly/index/trackBufferPtrs
  i32.const 128
  i32.const 5
  call $~lib/rt/stub/__new
  local.tee $0
  i32.const 0
  i32.const 128
  memory.fill
  local.get $0
  global.set $assembly/index/trackBufferLens
  i32.const 12
  i32.const 6
  call $~lib/rt/stub/__new
  i32.const 4096
  call $~lib/arraybuffer/ArrayBufferView#constructor
  global.set $assembly/index/windowLUT
  i32.const 256
  i32.const 8
  call $~lib/rt/stub/__new
  local.tee $0
  i32.const 0
  i32.const 256
  memory.fill
  local.get $0
  global.set $assembly/index/voices
  i32.const 12
  i32.const 9
  call $~lib/rt/stub/__new
  i32.const 64
  call $~lib/arraybuffer/ArrayBufferView#constructor
  global.set $assembly/index/freeVoiceIndices
  i32.const 64
  global.set $assembly/index/freeVoiceCount
 )
)
