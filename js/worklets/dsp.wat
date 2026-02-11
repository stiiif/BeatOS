(module
 (type $0 (func))
 (type $1 (func (param i32 i32) (result i32)))
 (type $2 (func (param i32)))
 (type $3 (func (param i32 i32 i32)))
 (type $4 (func (param i32 i32)))
 (type $5 (func (result i32)))
 (type $6 (func (param i32 i32 i32 i32)))
 (type $7 (func (param i32 i32 i64)))
 (type $8 (func (param i64) (result i32)))
 (type $9 (func (param f64) (result f64)))
 (type $10 (func (param i32 f32 f32 f32 f32 f32 f32)))
 (type $11 (func (param f32)))
 (type $12 (func (param i32) (result i32)))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $assembly/index/PTR_OUTPUT_START (mut i32) (i32.const 0))
 (global $assembly/index/PTR_LUT (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/total (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/threshold (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/state (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/visitCount (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/pinSpace (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/iter (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/toSpace (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/white (mut i32) (i32.const 0))
 (global $~lib/rt/itcms/fromSpace (mut i32) (i32.const 0))
 (global $~lib/rt/tlsf/ROOT (mut i32) (i32.const 0))
 (global $assembly/index/voices (mut i32) (i32.const 0))
 (global $assembly/index/trackBufferPtrs (mut i32) (i32.const 0))
 (global $assembly/index/trackBufferLens (mut i32) (i32.const 0))
 (global $assembly/index/rngState (mut i32) (i32.const -889275714))
 (global $assembly/index/outputBuffer (mut i32) (i32.const 0))
 (global $assembly/index/lutBuffer (mut i32) (i32.const 0))
 (global $assembly/index/sampleBuffers (mut i32) (i32.const 0))
 (global $~lib/math/rempio2_y0 (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y1 (mut f64) (f64.const 0))
 (global $~lib/math/res128_hi (mut i64) (i64.const 0))
 (global $~lib/memory/__stack_pointer (mut i32) (i32.const 34760))
 (memory $0 1)
 (data $0 (i32.const 1036) ",")
 (data $0.1 (i32.const 1048) "\02\00\00\00\1c\00\00\00I\00n\00v\00a\00l\00i\00d\00 \00l\00e\00n\00g\00t\00h")
 (data $1 (i32.const 1084) "<")
 (data $1.1 (i32.const 1096) "\02\00\00\00&\00\00\00~\00l\00i\00b\00/\00s\00t\00a\00t\00i\00c\00a\00r\00r\00a\00y\00.\00t\00s")
 (data $2 (i32.const 1148) "<")
 (data $2.1 (i32.const 1160) "\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e")
 (data $3 (i32.const 1212) "<")
 (data $3.1 (i32.const 1224) "\02\00\00\00 \00\00\00~\00l\00i\00b\00/\00r\00t\00/\00i\00t\00c\00m\00s\00.\00t\00s")
 (data $6 (i32.const 1340) "<")
 (data $6.1 (i32.const 1352) "\02\00\00\00$\00\00\00I\00n\00d\00e\00x\00 \00o\00u\00t\00 \00o\00f\00 \00r\00a\00n\00g\00e")
 (data $7 (i32.const 1404) ",")
 (data $7.1 (i32.const 1416) "\02\00\00\00\14\00\00\00~\00l\00i\00b\00/\00r\00t\00.\00t\00s")
 (data $9 (i32.const 1484) "<")
 (data $9.1 (i32.const 1496) "\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00t\00l\00s\00f\00.\00t\00s")
 (data $10 (i32.const 1548) "<")
 (data $10.1 (i32.const 1560) "\02\00\00\00&\00\00\00~\00l\00i\00b\00/\00a\00r\00r\00a\00y\00b\00u\00f\00f\00e\00r\00.\00t\00s")
 (data $11 (i32.const 1616) "n\83\f9\a2\00\00\00\00\d1W\'\fc)\15DN\99\95b\db\c0\dd4\f5\abcQ\feA\90C<:n$\b7a\c5\bb\de\ea.I\06\e0\d2MB\1c\eb\1d\fe\1c\92\d1\t\f55\82\e8>\a7)\b1&p\9c\e9\84D\bb.9\d6\919A~_\b4\8b_\84\9c\f49S\83\ff\97\f8\1f;(\f9\bd\8b\11/\ef\0f\98\05\de\cf~6m\1fm\nZf?FO\b7\t\cb\'\c7\ba\'u-\ea_\9e\f79\07={\f1\e5\eb\b1_\fbk\ea\92R\8aF0\03V\08]\8d\1f \bc\cf\f0\abk{\fca\91\e3\a9\1d6\f4\9a_\85\99e\08\1b\e6^\80\d8\ff\8d@h\a0\14W\15\06\061\'sM")
 (data $12 (i32.const 1820) "|")
 (data $12.1 (i32.const 1832) "\02\00\00\00^\00\00\00E\00l\00e\00m\00e\00n\00t\00 \00t\00y\00p\00e\00 \00m\00u\00s\00t\00 \00b\00e\00 \00n\00u\00l\00l\00a\00b\00l\00e\00 \00i\00f\00 \00a\00r\00r\00a\00y\00 \00i\00s\00 \00h\00o\00l\00e\00y")
 (data $13 (i32.const 1952) "\t\00\00\00 \00\00\00 \00\00\00 \00\00\00\00\00\00\00 \00\00\00\04A\00\00$\01\00\00$\t\00\00\10A\12")
 (export "init" (func $assembly/index/init))
 (export "allocateBuffer" (func $assembly/index/allocateBuffer))
 (export "getOutputBufferPtr" (func $assembly/index/getOutputBufferPtr))
 (export "spawnGrain" (func $assembly/index/spawnGrain))
 (export "process" (func $assembly/index/process))
 (export "memory" (memory $0))
 (start $~start)
 (func $~lib/rt/itcms/visitRoots
  (local $0 i32)
  (local $1 i32)
  global.get $assembly/index/voices
  local.tee $0
  if
   local.get $0
   call $~lib/rt/itcms/__visit
  end
  global.get $assembly/index/trackBufferPtrs
  local.tee $0
  if
   local.get $0
   call $~lib/rt/itcms/__visit
  end
  global.get $assembly/index/trackBufferLens
  local.tee $0
  if
   local.get $0
   call $~lib/rt/itcms/__visit
  end
  global.get $assembly/index/outputBuffer
  local.tee $0
  if
   local.get $0
   call $~lib/rt/itcms/__visit
  end
  global.get $assembly/index/lutBuffer
  local.tee $0
  if
   local.get $0
   call $~lib/rt/itcms/__visit
  end
  global.get $assembly/index/sampleBuffers
  local.tee $0
  if
   local.get $0
   call $~lib/rt/itcms/__visit
  end
  i32.const 1360
  call $~lib/rt/itcms/__visit
  i32.const 1056
  call $~lib/rt/itcms/__visit
  i32.const 1840
  call $~lib/rt/itcms/__visit
  i32.const 1168
  call $~lib/rt/itcms/__visit
  global.get $~lib/rt/itcms/pinSpace
  local.tee $1
  i32.load offset=4
  i32.const -4
  i32.and
  local.set $0
  loop $while-continue|0
   local.get $0
   local.get $1
   i32.ne
   if
    local.get $0
    i32.load offset=4
    drop
    local.get $0
    i32.const 20
    i32.add
    call $~lib/rt/__visit_members
    local.get $0
    i32.load offset=4
    i32.const -4
    i32.and
    local.set $0
    br $while-continue|0
   end
  end
 )
 (func $~lib/rt/itcms/Object#makeGray (param $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  local.get $0
  global.get $~lib/rt/itcms/iter
  i32.eq
  if
   local.get $0
   i32.load offset=8
   global.set $~lib/rt/itcms/iter
  end
  block $__inlined_func$~lib/rt/itcms/Object#unlink$237
   local.get $0
   i32.load offset=4
   i32.const -4
   i32.and
   local.tee $1
   i32.eqz
   if
    local.get $0
    i32.load offset=8
    drop
    br $__inlined_func$~lib/rt/itcms/Object#unlink$237
   end
   local.get $1
   local.get $0
   i32.load offset=8
   local.tee $2
   i32.store offset=8
   local.get $2
   local.get $1
   local.get $2
   i32.load offset=4
   i32.const 3
   i32.and
   i32.or
   i32.store offset=4
  end
  global.get $~lib/rt/itcms/toSpace
  local.set $2
  local.get $0
  i32.load offset=12
  local.tee $1
  i32.const 2
  i32.le_u
  if (result i32)
   i32.const 1
  else
   local.get $1
   i32.const 1952
   i32.load
   i32.gt_u
   if
    i32.const 1360
    i32.const 1424
    i32.const 21
    i32.const 28
    call $~lib/builtins/abort
    unreachable
   end
   local.get $1
   i32.const 2
   i32.shl
   i32.const 1956
   i32.add
   i32.load
   i32.const 32
   i32.and
  end
  local.set $3
  local.get $2
  i32.load offset=8
  local.set $1
  local.get $0
  global.get $~lib/rt/itcms/white
  i32.eqz
  i32.const 2
  local.get $3
  select
  local.get $2
  i32.or
  i32.store offset=4
  local.get $0
  local.get $1
  i32.store offset=8
  local.get $1
  local.get $0
  local.get $1
  i32.load offset=4
  i32.const 3
  i32.and
  i32.or
  i32.store offset=4
  local.get $2
  local.get $0
  i32.store offset=8
 )
 (func $~lib/rt/itcms/__visit (param $0 i32)
  local.get $0
  i32.eqz
  if
   return
  end
  global.get $~lib/rt/itcms/white
  local.get $0
  i32.const 20
  i32.sub
  local.tee $0
  i32.load offset=4
  i32.const 3
  i32.and
  i32.eq
  if
   local.get $0
   call $~lib/rt/itcms/Object#makeGray
   global.get $~lib/rt/itcms/visitCount
   i32.const 1
   i32.add
   global.set $~lib/rt/itcms/visitCount
  end
 )
 (func $~lib/rt/tlsf/removeBlock (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  local.get $1
  i32.load
  i32.const -4
  i32.and
  local.tee $3
  i32.const 256
  i32.lt_u
  if (result i32)
   local.get $3
   i32.const 4
   i32.shr_u
  else
   i32.const 31
   i32.const 1073741820
   local.get $3
   local.get $3
   i32.const 1073741820
   i32.ge_u
   select
   local.tee $3
   i32.clz
   i32.sub
   local.tee $4
   i32.const 7
   i32.sub
   local.set $2
   local.get $3
   local.get $4
   i32.const 4
   i32.sub
   i32.shr_u
   i32.const 16
   i32.xor
  end
  local.set $3
  local.get $1
  i32.load offset=8
  local.set $5
  local.get $1
  i32.load offset=4
  local.tee $4
  if
   local.get $4
   local.get $5
   i32.store offset=8
  end
  local.get $5
  if
   local.get $5
   local.get $4
   i32.store offset=4
  end
  local.get $1
  local.get $0
  local.get $2
  i32.const 4
  i32.shl
  local.get $3
  i32.add
  i32.const 2
  i32.shl
  i32.add
  local.tee $1
  i32.load offset=96
  i32.eq
  if
   local.get $1
   local.get $5
   i32.store offset=96
   local.get $5
   i32.eqz
   if
    local.get $0
    local.get $2
    i32.const 2
    i32.shl
    i32.add
    local.tee $1
    i32.load offset=4
    i32.const -2
    local.get $3
    i32.rotl
    i32.and
    local.set $3
    local.get $1
    local.get $3
    i32.store offset=4
    local.get $3
    i32.eqz
    if
     local.get $0
     local.get $0
     i32.load
     i32.const -2
     local.get $2
     i32.rotl
     i32.and
     i32.store
    end
   end
  end
 )
 (func $~lib/rt/tlsf/insertBlock (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  local.get $1
  i32.const 4
  i32.add
  local.tee $6
  local.get $1
  i32.load
  local.tee $3
  i32.const -4
  i32.and
  i32.add
  local.tee $4
  i32.load
  local.tee $2
  i32.const 1
  i32.and
  if
   local.get $0
   local.get $4
   call $~lib/rt/tlsf/removeBlock
   local.get $1
   local.get $3
   i32.const 4
   i32.add
   local.get $2
   i32.const -4
   i32.and
   i32.add
   local.tee $3
   i32.store
   local.get $6
   local.get $1
   i32.load
   i32.const -4
   i32.and
   i32.add
   local.tee $4
   i32.load
   local.set $2
  end
  local.get $3
  i32.const 2
  i32.and
  if
   local.get $1
   i32.const 4
   i32.sub
   i32.load
   local.tee $1
   i32.load
   local.set $6
   local.get $0
   local.get $1
   call $~lib/rt/tlsf/removeBlock
   local.get $1
   local.get $6
   i32.const 4
   i32.add
   local.get $3
   i32.const -4
   i32.and
   i32.add
   local.tee $3
   i32.store
  end
  local.get $4
  local.get $2
  i32.const 2
  i32.or
  i32.store
  local.get $4
  i32.const 4
  i32.sub
  local.get $1
  i32.store
  local.get $0
  local.get $3
  i32.const -4
  i32.and
  local.tee $2
  i32.const 256
  i32.lt_u
  if (result i32)
   local.get $2
   i32.const 4
   i32.shr_u
  else
   i32.const 31
   i32.const 1073741820
   local.get $2
   local.get $2
   i32.const 1073741820
   i32.ge_u
   select
   local.tee $2
   i32.clz
   i32.sub
   local.tee $3
   i32.const 7
   i32.sub
   local.set $5
   local.get $2
   local.get $3
   i32.const 4
   i32.sub
   i32.shr_u
   i32.const 16
   i32.xor
  end
  local.tee $2
  local.get $5
  i32.const 4
  i32.shl
  i32.add
  i32.const 2
  i32.shl
  i32.add
  i32.load offset=96
  local.set $3
  local.get $1
  i32.const 0
  i32.store offset=4
  local.get $1
  local.get $3
  i32.store offset=8
  local.get $3
  if
   local.get $3
   local.get $1
   i32.store offset=4
  end
  local.get $0
  local.get $5
  i32.const 4
  i32.shl
  local.get $2
  i32.add
  i32.const 2
  i32.shl
  i32.add
  local.get $1
  i32.store offset=96
  local.get $0
  local.get $0
  i32.load
  i32.const 1
  local.get $5
  i32.shl
  i32.or
  i32.store
  local.get $0
  local.get $5
  i32.const 2
  i32.shl
  i32.add
  local.tee $0
  local.get $0
  i32.load offset=4
  i32.const 1
  local.get $2
  i32.shl
  i32.or
  i32.store offset=4
 )
 (func $~lib/rt/tlsf/addMemory (param $0 i32) (param $1 i32) (param $2 i64)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  local.get $1
  i32.const 19
  i32.add
  i32.const -16
  i32.and
  i32.const 4
  i32.sub
  local.set $1
  local.get $0
  i32.load offset=1568
  local.tee $3
  if
   local.get $3
   local.get $1
   i32.const 16
   i32.sub
   local.tee $5
   i32.eq
   if
    local.get $3
    i32.load
    local.set $4
    local.get $5
    local.set $1
   end
  end
  local.get $2
  i32.wrap_i64
  i32.const -16
  i32.and
  local.get $1
  i32.sub
  local.tee $3
  i32.const 20
  i32.lt_u
  if
   return
  end
  local.get $1
  local.get $4
  i32.const 2
  i32.and
  local.get $3
  i32.const 8
  i32.sub
  local.tee $3
  i32.const 1
  i32.or
  i32.or
  i32.store
  local.get $1
  i32.const 0
  i32.store offset=4
  local.get $1
  i32.const 0
  i32.store offset=8
  local.get $1
  i32.const 4
  i32.add
  local.get $3
  i32.add
  local.tee $3
  i32.const 2
  i32.store
  local.get $0
  local.get $3
  i32.store offset=1568
  local.get $0
  local.get $1
  call $~lib/rt/tlsf/insertBlock
 )
 (func $~lib/rt/tlsf/initialize
  (local $0 i32)
  (local $1 i32)
  memory.size
  local.tee $1
  i32.const 0
  i32.le_s
  if (result i32)
   i32.const 1
   local.get $1
   i32.sub
   memory.grow
   i32.const 0
   i32.lt_s
  else
   i32.const 0
  end
  if
   unreachable
  end
  i32.const 34768
  i32.const 0
  i32.store
  i32.const 36336
  i32.const 0
  i32.store
  loop $for-loop|0
   local.get $0
   i32.const 23
   i32.lt_u
   if
    local.get $0
    i32.const 2
    i32.shl
    i32.const 34768
    i32.add
    i32.const 0
    i32.store offset=4
    i32.const 0
    local.set $1
    loop $for-loop|1
     local.get $1
     i32.const 16
     i32.lt_u
     if
      local.get $0
      i32.const 4
      i32.shl
      local.get $1
      i32.add
      i32.const 2
      i32.shl
      i32.const 34768
      i32.add
      i32.const 0
      i32.store offset=96
      local.get $1
      i32.const 1
      i32.add
      local.set $1
      br $for-loop|1
     end
    end
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
  i32.const 34768
  i32.const 36340
  memory.size
  i64.extend_i32_s
  i64.const 16
  i64.shl
  call $~lib/rt/tlsf/addMemory
  i32.const 34768
  global.set $~lib/rt/tlsf/ROOT
 )
 (func $~lib/rt/itcms/step (result i32)
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  block $break|0
   block $case2|0
    block $case1|0
     block $case0|0
      global.get $~lib/rt/itcms/state
      br_table $case0|0 $case1|0 $case2|0 $break|0
     end
     i32.const 1
     global.set $~lib/rt/itcms/state
     i32.const 0
     global.set $~lib/rt/itcms/visitCount
     call $~lib/rt/itcms/visitRoots
     global.get $~lib/rt/itcms/toSpace
     global.set $~lib/rt/itcms/iter
     global.get $~lib/rt/itcms/visitCount
     return
    end
    global.get $~lib/rt/itcms/white
    i32.eqz
    local.set $1
    global.get $~lib/rt/itcms/iter
    i32.load offset=4
    i32.const -4
    i32.and
    local.set $0
    loop $while-continue|1
     local.get $0
     global.get $~lib/rt/itcms/toSpace
     i32.ne
     if
      local.get $0
      global.set $~lib/rt/itcms/iter
      local.get $1
      local.get $0
      i32.load offset=4
      local.tee $2
      i32.const 3
      i32.and
      i32.ne
      if
       local.get $0
       local.get $2
       i32.const -4
       i32.and
       local.get $1
       i32.or
       i32.store offset=4
       i32.const 0
       global.set $~lib/rt/itcms/visitCount
       local.get $0
       i32.const 20
       i32.add
       call $~lib/rt/__visit_members
       global.get $~lib/rt/itcms/visitCount
       return
      end
      local.get $0
      i32.load offset=4
      i32.const -4
      i32.and
      local.set $0
      br $while-continue|1
     end
    end
    i32.const 0
    global.set $~lib/rt/itcms/visitCount
    call $~lib/rt/itcms/visitRoots
    global.get $~lib/rt/itcms/toSpace
    global.get $~lib/rt/itcms/iter
    i32.load offset=4
    i32.const -4
    i32.and
    i32.eq
    if
     global.get $~lib/memory/__stack_pointer
     local.set $0
     loop $while-continue|0
      local.get $0
      i32.const 34760
      i32.lt_u
      if
       local.get $0
       i32.load
       call $~lib/rt/itcms/__visit
       local.get $0
       i32.const 4
       i32.add
       local.set $0
       br $while-continue|0
      end
     end
     global.get $~lib/rt/itcms/iter
     i32.load offset=4
     i32.const -4
     i32.and
     local.set $0
     loop $while-continue|2
      local.get $0
      global.get $~lib/rt/itcms/toSpace
      i32.ne
      if
       local.get $1
       local.get $0
       i32.load offset=4
       local.tee $2
       i32.const 3
       i32.and
       i32.ne
       if
        local.get $0
        local.get $2
        i32.const -4
        i32.and
        local.get $1
        i32.or
        i32.store offset=4
        local.get $0
        i32.const 20
        i32.add
        call $~lib/rt/__visit_members
       end
       local.get $0
       i32.load offset=4
       i32.const -4
       i32.and
       local.set $0
       br $while-continue|2
      end
     end
     global.get $~lib/rt/itcms/fromSpace
     local.set $0
     global.get $~lib/rt/itcms/toSpace
     global.set $~lib/rt/itcms/fromSpace
     local.get $0
     global.set $~lib/rt/itcms/toSpace
     local.get $1
     global.set $~lib/rt/itcms/white
     local.get $0
     i32.load offset=4
     i32.const -4
     i32.and
     global.set $~lib/rt/itcms/iter
     i32.const 2
     global.set $~lib/rt/itcms/state
    end
    global.get $~lib/rt/itcms/visitCount
    return
   end
   global.get $~lib/rt/itcms/iter
   local.tee $0
   global.get $~lib/rt/itcms/toSpace
   i32.ne
   if
    local.get $0
    i32.load offset=4
    i32.const -4
    i32.and
    global.set $~lib/rt/itcms/iter
    local.get $0
    i32.const 34760
    i32.lt_u
    if
     local.get $0
     i32.const 0
     i32.store offset=4
     local.get $0
     i32.const 0
     i32.store offset=8
    else
     global.get $~lib/rt/itcms/total
     local.get $0
     i32.load
     i32.const -4
     i32.and
     i32.const 4
     i32.add
     i32.sub
     global.set $~lib/rt/itcms/total
     local.get $0
     i32.const 4
     i32.add
     local.tee $0
     i32.const 34760
     i32.ge_u
     if
      global.get $~lib/rt/tlsf/ROOT
      i32.eqz
      if
       call $~lib/rt/tlsf/initialize
      end
      local.get $0
      i32.const 4
      i32.sub
      local.set $1
      local.get $0
      i32.const 15
      i32.and
      i32.const 1
      local.get $0
      select
      if (result i32)
       i32.const 1
      else
       local.get $1
       i32.load
       i32.const 1
       i32.and
      end
      drop
      local.get $1
      local.get $1
      i32.load
      i32.const 1
      i32.or
      i32.store
      global.get $~lib/rt/tlsf/ROOT
      local.get $1
      call $~lib/rt/tlsf/insertBlock
     end
    end
    i32.const 10
    return
   end
   global.get $~lib/rt/itcms/toSpace
   global.get $~lib/rt/itcms/toSpace
   i32.store offset=4
   global.get $~lib/rt/itcms/toSpace
   global.get $~lib/rt/itcms/toSpace
   i32.store offset=8
   i32.const 0
   global.set $~lib/rt/itcms/state
  end
  i32.const 0
 )
 (func $~lib/rt/tlsf/searchBlock (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  local.get $1
  i32.const 256
  i32.lt_u
  if
   local.get $1
   i32.const 4
   i32.shr_u
   local.set $1
  else
   local.get $1
   i32.const 536870910
   i32.lt_u
   if
    local.get $1
    i32.const 1
    i32.const 27
    local.get $1
    i32.clz
    i32.sub
    i32.shl
    i32.add
    i32.const 1
    i32.sub
    local.set $1
   end
   local.get $1
   i32.const 31
   local.get $1
   i32.clz
   i32.sub
   local.tee $2
   i32.const 4
   i32.sub
   i32.shr_u
   i32.const 16
   i32.xor
   local.set $1
   local.get $2
   i32.const 7
   i32.sub
   local.set $2
  end
  local.get $0
  local.get $2
  i32.const 2
  i32.shl
  i32.add
  i32.load offset=4
  i32.const -1
  local.get $1
  i32.shl
  i32.and
  local.tee $1
  if (result i32)
   local.get $0
   local.get $1
   i32.ctz
   local.get $2
   i32.const 4
   i32.shl
   i32.add
   i32.const 2
   i32.shl
   i32.add
   i32.load offset=96
  else
   local.get $0
   i32.load
   i32.const -1
   local.get $2
   i32.const 1
   i32.add
   i32.shl
   i32.and
   local.tee $1
   if (result i32)
    local.get $0
    local.get $0
    local.get $1
    i32.ctz
    local.tee $0
    i32.const 2
    i32.shl
    i32.add
    i32.load offset=4
    i32.ctz
    local.get $0
    i32.const 4
    i32.shl
    i32.add
    i32.const 2
    i32.shl
    i32.add
    i32.load offset=96
   else
    i32.const 0
   end
  end
 )
 (func $~lib/rt/itcms/__new (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  local.get $0
  i32.const 1073741804
  i32.ge_u
  if
   i32.const 1168
   i32.const 1232
   i32.const 261
   i32.const 31
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/rt/itcms/total
  global.get $~lib/rt/itcms/threshold
  i32.ge_u
  if
   block $__inlined_func$~lib/rt/itcms/interrupt$69
    i32.const 2048
    local.set $2
    loop $do-loop|0
     local.get $2
     call $~lib/rt/itcms/step
     i32.sub
     local.set $2
     global.get $~lib/rt/itcms/state
     i32.eqz
     if
      global.get $~lib/rt/itcms/total
      i64.extend_i32_u
      i64.const 200
      i64.mul
      i64.const 100
      i64.div_u
      i32.wrap_i64
      i32.const 1024
      i32.add
      global.set $~lib/rt/itcms/threshold
      br $__inlined_func$~lib/rt/itcms/interrupt$69
     end
     local.get $2
     i32.const 0
     i32.gt_s
     br_if $do-loop|0
    end
    global.get $~lib/rt/itcms/total
    global.get $~lib/rt/itcms/total
    global.get $~lib/rt/itcms/threshold
    i32.sub
    i32.const 1024
    i32.lt_u
    i32.const 10
    i32.shl
    i32.add
    global.set $~lib/rt/itcms/threshold
   end
  end
  global.get $~lib/rt/tlsf/ROOT
  i32.eqz
  if
   call $~lib/rt/tlsf/initialize
  end
  global.get $~lib/rt/tlsf/ROOT
  local.set $3
  local.get $0
  i32.const 16
  i32.add
  local.tee $2
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 1168
   i32.const 1504
   i32.const 461
   i32.const 29
   call $~lib/builtins/abort
   unreachable
  end
  local.get $3
  local.get $2
  i32.const 12
  i32.le_u
  if (result i32)
   i32.const 12
  else
   local.get $2
   i32.const 19
   i32.add
   i32.const -16
   i32.and
   i32.const 4
   i32.sub
  end
  local.tee $5
  call $~lib/rt/tlsf/searchBlock
  local.tee $2
  i32.eqz
  if
   memory.size
   local.tee $2
   local.get $5
   i32.const 256
   i32.ge_u
   if (result i32)
    local.get $5
    i32.const 536870910
    i32.lt_u
    if (result i32)
     local.get $5
     i32.const 1
     i32.const 27
     local.get $5
     i32.clz
     i32.sub
     i32.shl
     i32.add
     i32.const 1
     i32.sub
    else
     local.get $5
    end
   else
    local.get $5
   end
   i32.const 4
   local.get $3
   i32.load offset=1568
   local.get $2
   i32.const 16
   i32.shl
   i32.const 4
   i32.sub
   i32.ne
   i32.shl
   i32.add
   i32.const 65535
   i32.add
   i32.const -65536
   i32.and
   i32.const 16
   i32.shr_u
   local.tee $4
   local.get $2
   local.get $4
   i32.gt_s
   select
   memory.grow
   i32.const 0
   i32.lt_s
   if
    local.get $4
    memory.grow
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
   local.get $3
   local.get $2
   i32.const 16
   i32.shl
   memory.size
   i64.extend_i32_s
   i64.const 16
   i64.shl
   call $~lib/rt/tlsf/addMemory
   local.get $3
   local.get $5
   call $~lib/rt/tlsf/searchBlock
   local.set $2
  end
  local.get $2
  i32.load
  drop
  local.get $3
  local.get $2
  call $~lib/rt/tlsf/removeBlock
  local.get $2
  i32.load
  local.tee $6
  i32.const -4
  i32.and
  local.get $5
  i32.sub
  local.tee $4
  i32.const 16
  i32.ge_u
  if
   local.get $2
   local.get $5
   local.get $6
   i32.const 2
   i32.and
   i32.or
   i32.store
   local.get $2
   i32.const 4
   i32.add
   local.get $5
   i32.add
   local.tee $5
   local.get $4
   i32.const 4
   i32.sub
   i32.const 1
   i32.or
   i32.store
   local.get $3
   local.get $5
   call $~lib/rt/tlsf/insertBlock
  else
   local.get $2
   local.get $6
   i32.const -2
   i32.and
   i32.store
   local.get $2
   i32.const 4
   i32.add
   local.get $2
   i32.load
   i32.const -4
   i32.and
   i32.add
   local.tee $3
   local.get $3
   i32.load
   i32.const -3
   i32.and
   i32.store
  end
  local.get $2
  local.get $1
  i32.store offset=12
  local.get $2
  local.get $0
  i32.store offset=16
  global.get $~lib/rt/itcms/fromSpace
  local.tee $1
  i32.load offset=8
  local.set $3
  local.get $2
  local.get $1
  global.get $~lib/rt/itcms/white
  i32.or
  i32.store offset=4
  local.get $2
  local.get $3
  i32.store offset=8
  local.get $3
  local.get $2
  local.get $3
  i32.load offset=4
  i32.const 3
  i32.and
  i32.or
  i32.store offset=4
  local.get $1
  local.get $2
  i32.store offset=8
  global.get $~lib/rt/itcms/total
  local.get $2
  i32.load
  i32.const -4
  i32.and
  i32.const 4
  i32.add
  i32.add
  global.set $~lib/rt/itcms/total
  local.get $2
  i32.const 20
  i32.add
  local.tee $1
  i32.const 0
  local.get $0
  memory.fill
  local.get $1
 )
 (func $~lib/rt/itcms/__link (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 i32)
  local.get $1
  i32.eqz
  if
   return
  end
  global.get $~lib/rt/itcms/white
  local.get $1
  i32.const 20
  i32.sub
  local.tee $1
  i32.load offset=4
  i32.const 3
  i32.and
  i32.eq
  if
   local.get $0
   i32.const 20
   i32.sub
   local.tee $0
   i32.load offset=4
   i32.const 3
   i32.and
   local.tee $3
   global.get $~lib/rt/itcms/white
   i32.eqz
   i32.eq
   if
    local.get $0
    local.get $1
    local.get $2
    select
    call $~lib/rt/itcms/Object#makeGray
   else
    global.get $~lib/rt/itcms/state
    i32.const 1
    i32.eq
    local.get $3
    i32.const 3
    i32.eq
    i32.and
    if
     local.get $1
     call $~lib/rt/itcms/Object#makeGray
    end
   end
  end
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
  i32.const 1616
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
 (func $assembly/index/getOutputBufferPtr (result i32)
  global.get $assembly/index/PTR_OUTPUT_START
 )
 (func $~lib/rt/__visit_members (param $0 i32)
  (local $1 i32)
  (local $2 i32)
  block $invalid
   block $"~lib/map/Map<i32,~lib/arraybuffer/ArrayBuffer>"
    block $~lib/staticarray/StaticArray<i32>
     block $~lib/staticarray/StaticArray<usize>
      block $~lib/staticarray/StaticArray<assembly/index/Voice>
       block $assembly/index/Voice
        block $~lib/arraybuffer/ArrayBufferView
         block $~lib/string/String
          block $~lib/arraybuffer/ArrayBuffer
           block $~lib/object/Object
            local.get $0
            i32.const 8
            i32.sub
            i32.load
            br_table $~lib/object/Object $~lib/arraybuffer/ArrayBuffer $~lib/string/String $~lib/arraybuffer/ArrayBufferView $assembly/index/Voice $~lib/staticarray/StaticArray<assembly/index/Voice> $~lib/staticarray/StaticArray<usize> $~lib/staticarray/StaticArray<i32> $"~lib/map/Map<i32,~lib/arraybuffer/ArrayBuffer>" $invalid
           end
           return
          end
          return
         end
         return
        end
        local.get $0
        i32.load
        call $~lib/rt/itcms/__visit
        return
       end
       return
      end
      local.get $0
      local.get $0
      i32.const 20
      i32.sub
      i32.load offset=16
      i32.add
      local.set $1
      loop $while-continue|0
       local.get $0
       local.get $1
       i32.lt_u
       if
        local.get $0
        i32.load
        local.tee $2
        if
         local.get $2
         call $~lib/rt/itcms/__visit
        end
        local.get $0
        i32.const 4
        i32.add
        local.set $0
        br $while-continue|0
       end
      end
      return
     end
     return
    end
    return
   end
   global.get $~lib/memory/__stack_pointer
   i32.const 4
   i32.sub
   global.set $~lib/memory/__stack_pointer
   global.get $~lib/memory/__stack_pointer
   i32.const 1992
   i32.lt_s
   if
    i32.const 34784
    i32.const 34832
    i32.const 1
    i32.const 1
    call $~lib/builtins/abort
    unreachable
   end
   global.get $~lib/memory/__stack_pointer
   i32.const 0
   i32.store
   global.get $~lib/memory/__stack_pointer
   local.get $0
   i32.store
   local.get $0
   i32.load
   call $~lib/rt/itcms/__visit
   global.get $~lib/memory/__stack_pointer
   local.get $0
   i32.store
   local.get $0
   i32.load offset=8
   local.tee $2
   local.set $1
   global.get $~lib/memory/__stack_pointer
   local.get $0
   i32.store
   local.get $1
   local.get $0
   i32.load offset=16
   i32.const 12
   i32.mul
   i32.add
   local.set $0
   loop $while-continue|01
    local.get $0
    local.get $1
    i32.gt_u
    if
     local.get $1
     i32.load offset=8
     i32.const 1
     i32.and
     i32.eqz
     if
      local.get $1
      i32.load offset=4
      call $~lib/rt/itcms/__visit
     end
     local.get $1
     i32.const 12
     i32.add
     local.set $1
     br $while-continue|01
    end
   end
   local.get $2
   call $~lib/rt/itcms/__visit
   global.get $~lib/memory/__stack_pointer
   i32.const 4
   i32.add
   global.set $~lib/memory/__stack_pointer
   return
  end
  unreachable
 )
 (func $~start
  (local $0 i32)
  (local $1 i32)
  block $__inlined_func$start:assembly/index
   memory.size
   i32.const 16
   i32.shl
   i32.const 34760
   i32.sub
   i32.const 1
   i32.shr_u
   global.set $~lib/rt/itcms/threshold
   i32.const 1284
   i32.const 1280
   i32.store
   i32.const 1288
   i32.const 1280
   i32.store
   i32.const 1280
   global.set $~lib/rt/itcms/pinSpace
   i32.const 1316
   i32.const 1312
   i32.store
   i32.const 1320
   i32.const 1312
   i32.store
   i32.const 1312
   global.set $~lib/rt/itcms/toSpace
   i32.const 1460
   i32.const 1456
   i32.store
   i32.const 1464
   i32.const 1456
   i32.store
   i32.const 1456
   global.set $~lib/rt/itcms/fromSpace
   global.get $~lib/memory/__stack_pointer
   i32.const 4
   i32.sub
   global.set $~lib/memory/__stack_pointer
   block $folding-inner0
    global.get $~lib/memory/__stack_pointer
    i32.const 1992
    i32.lt_s
    br_if $folding-inner0
    global.get $~lib/memory/__stack_pointer
    i32.const 0
    i32.store
    global.get $~lib/memory/__stack_pointer
    i32.const 256
    i32.const 5
    call $~lib/rt/itcms/__new
    local.tee $0
    i32.store
    global.get $~lib/memory/__stack_pointer
    i32.const 4
    i32.add
    global.set $~lib/memory/__stack_pointer
    local.get $0
    global.set $assembly/index/voices
    global.get $~lib/memory/__stack_pointer
    i32.const 4
    i32.sub
    global.set $~lib/memory/__stack_pointer
    global.get $~lib/memory/__stack_pointer
    i32.const 1992
    i32.lt_s
    br_if $folding-inner0
    global.get $~lib/memory/__stack_pointer
    i32.const 0
    i32.store
    global.get $~lib/memory/__stack_pointer
    i32.const 128
    i32.const 6
    call $~lib/rt/itcms/__new
    local.tee $0
    i32.store
    global.get $~lib/memory/__stack_pointer
    i32.const 4
    i32.add
    global.set $~lib/memory/__stack_pointer
    local.get $0
    global.set $assembly/index/trackBufferPtrs
    global.get $~lib/memory/__stack_pointer
    i32.const 4
    i32.sub
    global.set $~lib/memory/__stack_pointer
    global.get $~lib/memory/__stack_pointer
    i32.const 1992
    i32.lt_s
    br_if $folding-inner0
    global.get $~lib/memory/__stack_pointer
    i32.const 0
    i32.store
    global.get $~lib/memory/__stack_pointer
    i32.const 128
    i32.const 7
    call $~lib/rt/itcms/__new
    local.tee $0
    i32.store
    global.get $~lib/memory/__stack_pointer
    i32.const 4
    i32.add
    global.set $~lib/memory/__stack_pointer
    local.get $0
    global.set $assembly/index/trackBufferLens
    global.get $~lib/memory/__stack_pointer
    i32.const 12
    i32.sub
    global.set $~lib/memory/__stack_pointer
    global.get $~lib/memory/__stack_pointer
    i32.const 1992
    i32.lt_s
    br_if $folding-inner0
    global.get $~lib/memory/__stack_pointer
    i64.const 0
    i64.store
    global.get $~lib/memory/__stack_pointer
    i32.const 0
    i32.store offset=8
    global.get $~lib/memory/__stack_pointer
    i32.const 24
    i32.const 8
    call $~lib/rt/itcms/__new
    local.tee $0
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store offset=4
    i32.const 16
    call $~lib/arraybuffer/ArrayBuffer#constructor
    local.set $1
    global.get $~lib/memory/__stack_pointer
    local.get $1
    i32.store offset=8
    local.get $0
    local.get $1
    i32.store
    local.get $0
    local.get $1
    i32.const 0
    call $~lib/rt/itcms/__link
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store offset=4
    local.get $0
    i32.const 3
    i32.store offset=4
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store offset=4
    i32.const 48
    call $~lib/arraybuffer/ArrayBuffer#constructor
    local.set $1
    global.get $~lib/memory/__stack_pointer
    local.get $1
    i32.store offset=8
    local.get $0
    local.get $1
    i32.store offset=8
    local.get $0
    local.get $1
    i32.const 0
    call $~lib/rt/itcms/__link
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store offset=4
    local.get $0
    i32.const 4
    i32.store offset=12
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store offset=4
    local.get $0
    i32.const 0
    i32.store offset=16
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store offset=4
    local.get $0
    i32.const 0
    i32.store offset=20
    global.get $~lib/memory/__stack_pointer
    i32.const 12
    i32.add
    global.set $~lib/memory/__stack_pointer
    local.get $0
    global.set $assembly/index/sampleBuffers
    br $__inlined_func$start:assembly/index
   end
   i32.const 34784
   i32.const 34832
   i32.const 1
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
 )
 (func $assembly/index/init
  (local $0 i32)
  (local $1 i32)
  (local $2 f32)
  (local $3 i32)
  (local $4 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.sub
  global.set $~lib/memory/__stack_pointer
  block $folding-inner1
   global.get $~lib/memory/__stack_pointer
   i32.const 1992
   i32.lt_s
   br_if $folding-inner1
   global.get $~lib/memory/__stack_pointer
   i64.const 0
   i64.store
   i32.const 32768
   call $~lib/arraybuffer/ArrayBuffer#constructor
   global.set $assembly/index/outputBuffer
   global.get $assembly/index/outputBuffer
   global.set $assembly/index/PTR_OUTPUT_START
   i32.const 16384
   call $~lib/arraybuffer/ArrayBuffer#constructor
   global.set $assembly/index/lutBuffer
   global.get $assembly/index/lutBuffer
   global.set $assembly/index/PTR_LUT
   loop $for-loop|0
    local.get $3
    i32.const 64
    i32.lt_s
    if
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/index/voices
     local.tee $1
     i32.store
     block $__inlined_func$assembly/index/Voice#constructor$1 (result i32)
      global.get $~lib/memory/__stack_pointer
      i32.const 8
      i32.sub
      global.set $~lib/memory/__stack_pointer
      block $folding-inner00
       global.get $~lib/memory/__stack_pointer
       i32.const 1992
       i32.lt_s
       br_if $folding-inner00
       global.get $~lib/memory/__stack_pointer
       i64.const 0
       i64.store
       global.get $~lib/memory/__stack_pointer
       i32.const 48
       i32.const 4
       call $~lib/rt/itcms/__new
       local.tee $0
       i32.store
       global.get $~lib/memory/__stack_pointer
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       global.get $~lib/memory/__stack_pointer
       i32.const 4
       i32.sub
       global.set $~lib/memory/__stack_pointer
       global.get $~lib/memory/__stack_pointer
       i32.const 1992
       i32.lt_s
       br_if $folding-inner00
       global.get $~lib/memory/__stack_pointer
       i32.const 0
       i32.store
       local.get $0
       i32.eqz
       if
        global.get $~lib/memory/__stack_pointer
        i32.const 0
        i32.const 0
        call $~lib/rt/itcms/__new
        local.tee $0
        i32.store
       end
       global.get $~lib/memory/__stack_pointer
       i32.const 4
       i32.add
       global.set $~lib/memory/__stack_pointer
       local.get $0
       i32.store
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       i32.const 0
       i32.store8
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       i32.const 0
       i32.store offset=4
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       i32.const 0
       i32.store offset=8
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       i32.const 0
       i32.store offset=12
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       f32.const 0
       f32.store offset=16
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       f32.const 0
       f32.store offset=20
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       f32.const 0
       f32.store offset=24
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       f32.const 1
       f32.store offset=28
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       f32.const 1
       f32.store offset=32
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       f32.const 0
       f32.store offset=36
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       i32.const 0
       i32.store8 offset=40
       global.get $~lib/memory/__stack_pointer
       local.get $0
       i32.store offset=4
       local.get $0
       f32.const 1
       f32.store offset=44
       global.get $~lib/memory/__stack_pointer
       i32.const 8
       i32.add
       global.set $~lib/memory/__stack_pointer
       local.get $0
       br $__inlined_func$assembly/index/Voice#constructor$1
      end
      br $folding-inner1
     end
     local.set $0
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=4
     global.get $~lib/memory/__stack_pointer
     i32.const 8
     i32.sub
     global.set $~lib/memory/__stack_pointer
     global.get $~lib/memory/__stack_pointer
     i32.const 1992
     i32.lt_s
     br_if $folding-inner1
     global.get $~lib/memory/__stack_pointer
     i64.const 0
     i64.store
     global.get $~lib/memory/__stack_pointer
     local.get $1
     i32.store
     local.get $3
     local.get $1
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
     global.get $~lib/memory/__stack_pointer
     local.get $1
     i32.store
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=4
     local.get $1
     local.get $3
     i32.const 2
     i32.shl
     i32.add
     local.get $0
     i32.store
     local.get $1
     local.get $0
     i32.const 1
     call $~lib/rt/itcms/__link
     global.get $~lib/memory/__stack_pointer
     i32.const 8
     i32.add
     global.set $~lib/memory/__stack_pointer
     local.get $3
     i32.const 1
     i32.add
     local.set $3
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
     global.get $assembly/index/PTR_LUT
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
   global.get $~lib/memory/__stack_pointer
   i32.const 8
   i32.add
   global.set $~lib/memory/__stack_pointer
   return
  end
  i32.const 34784
  i32.const 34832
  i32.const 1
  i32.const 1
  call $~lib/builtins/abort
  unreachable
 )
 (func $"~lib/map/Map<i32,~lib/arraybuffer/ArrayBuffer>#set" (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 12
  i32.sub
  global.set $~lib/memory/__stack_pointer
  block $folding-inner1
   global.get $~lib/memory/__stack_pointer
   i32.const 1992
   i32.lt_s
   br_if $folding-inner1
   global.get $~lib/memory/__stack_pointer
   i64.const 0
   i64.store
   global.get $~lib/memory/__stack_pointer
   i32.const 0
   i32.store offset=8
   global.get $~lib/memory/__stack_pointer
   local.get $0
   i32.store
   global.get $~lib/memory/__stack_pointer
   i32.const 4
   i32.sub
   global.set $~lib/memory/__stack_pointer
   global.get $~lib/memory/__stack_pointer
   i32.const 1992
   i32.lt_s
   br_if $folding-inner1
   global.get $~lib/memory/__stack_pointer
   i32.const 0
   i32.store
   global.get $~lib/memory/__stack_pointer
   local.get $0
   i32.store
   local.get $0
   i32.load
   global.get $~lib/memory/__stack_pointer
   local.get $0
   i32.store
   local.get $1
   i32.const -1028477379
   i32.mul
   i32.const 374761397
   i32.add
   i32.const 17
   i32.rotl
   i32.const 668265263
   i32.mul
   local.tee $3
   local.get $3
   i32.const 15
   i32.shr_u
   i32.xor
   i32.const -2048144777
   i32.mul
   local.tee $3
   local.get $3
   i32.const 13
   i32.shr_u
   i32.xor
   i32.const -1028477379
   i32.mul
   local.tee $3
   local.get $3
   i32.const 16
   i32.shr_u
   i32.xor
   local.tee $9
   local.get $0
   i32.load offset=4
   i32.and
   i32.const 2
   i32.shl
   i32.add
   i32.load
   local.set $3
   block $"__inlined_func$~lib/map/Map<i32,~lib/arraybuffer/ArrayBuffer>#find$232"
    loop $while-continue|0
     local.get $3
     if
      local.get $3
      i32.load offset=8
      local.tee $4
      i32.const 1
      i32.and
      if (result i32)
       i32.const 0
      else
       local.get $1
       local.get $3
       i32.load
       i32.eq
      end
      if
       global.get $~lib/memory/__stack_pointer
       i32.const 4
       i32.add
       global.set $~lib/memory/__stack_pointer
       br $"__inlined_func$~lib/map/Map<i32,~lib/arraybuffer/ArrayBuffer>#find$232"
      end
      local.get $4
      i32.const -2
      i32.and
      local.set $3
      br $while-continue|0
     end
    end
    global.get $~lib/memory/__stack_pointer
    i32.const 4
    i32.add
    global.set $~lib/memory/__stack_pointer
    i32.const 0
    local.set $3
   end
   local.get $3
   if
    global.get $~lib/memory/__stack_pointer
    local.get $2
    i32.store
    local.get $3
    local.get $2
    i32.store offset=4
    local.get $0
    local.get $2
    i32.const 1
    call $~lib/rt/itcms/__link
   else
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store
    local.get $0
    i32.load offset=16
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store
    local.get $0
    i32.load offset=12
    i32.eq
    if
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=4
     local.get $0
     i32.load offset=20
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=4
     local.get $0
     i32.load offset=12
     i32.const 3
     i32.mul
     i32.const 4
     i32.div_s
     i32.lt_s
     if (result i32)
      global.get $~lib/memory/__stack_pointer
      local.get $0
      i32.store offset=4
      local.get $0
      i32.load offset=4
     else
      global.get $~lib/memory/__stack_pointer
      local.get $0
      i32.store offset=4
      local.get $0
      i32.load offset=4
      i32.const 1
      i32.shl
      i32.const 1
      i32.or
     end
     local.set $5
     global.get $~lib/memory/__stack_pointer
     i32.const 16
     i32.sub
     global.set $~lib/memory/__stack_pointer
     global.get $~lib/memory/__stack_pointer
     i32.const 1992
     i32.lt_s
     br_if $folding-inner1
     global.get $~lib/memory/__stack_pointer
     i64.const 0
     i64.store
     global.get $~lib/memory/__stack_pointer
     i64.const 0
     i64.store offset=8
     global.get $~lib/memory/__stack_pointer
     local.get $5
     i32.const 1
     i32.add
     local.tee $3
     i32.const 2
     i32.shl
     call $~lib/arraybuffer/ArrayBuffer#constructor
     local.tee $10
     i32.store
     global.get $~lib/memory/__stack_pointer
     local.get $3
     i32.const 3
     i32.shl
     i32.const 3
     i32.div_s
     local.tee $8
     i32.const 12
     i32.mul
     call $~lib/arraybuffer/ArrayBuffer#constructor
     local.tee $4
     i32.store offset=4
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=8
     local.get $0
     i32.load offset=8
     local.set $11
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=8
     local.get $11
     local.get $0
     i32.load offset=16
     i32.const 12
     i32.mul
     i32.add
     local.set $7
     local.get $4
     local.set $3
     loop $while-continue|00
      local.get $7
      local.get $11
      i32.ne
      if
       local.get $11
       i32.load offset=8
       i32.const 1
       i32.and
       i32.eqz
       if
        local.get $3
        local.get $11
        i32.load
        local.tee $12
        i32.store
        global.get $~lib/memory/__stack_pointer
        local.get $11
        i32.load offset=4
        local.tee $6
        i32.store offset=8
        local.get $3
        local.get $6
        i32.store offset=4
        local.get $3
        local.get $10
        local.get $5
        local.get $12
        i32.const -1028477379
        i32.mul
        i32.const 374761397
        i32.add
        i32.const 17
        i32.rotl
        i32.const 668265263
        i32.mul
        local.tee $6
        i32.const 15
        i32.shr_u
        local.get $6
        i32.xor
        i32.const -2048144777
        i32.mul
        local.tee $6
        i32.const 13
        i32.shr_u
        local.get $6
        i32.xor
        i32.const -1028477379
        i32.mul
        local.tee $6
        i32.const 16
        i32.shr_u
        local.get $6
        i32.xor
        i32.and
        i32.const 2
        i32.shl
        i32.add
        local.tee $6
        i32.load
        i32.store offset=8
        local.get $6
        local.get $3
        i32.store
        local.get $3
        i32.const 12
        i32.add
        local.set $3
       end
       local.get $11
       i32.const 12
       i32.add
       local.set $11
       br $while-continue|00
      end
     end
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=8
     global.get $~lib/memory/__stack_pointer
     local.get $10
     i32.store offset=12
     local.get $0
     local.get $10
     i32.store
     local.get $0
     local.get $10
     i32.const 0
     call $~lib/rt/itcms/__link
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=8
     local.get $0
     local.get $5
     i32.store offset=4
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=8
     global.get $~lib/memory/__stack_pointer
     local.get $4
     i32.store offset=12
     local.get $0
     local.get $4
     i32.store offset=8
     local.get $0
     local.get $4
     i32.const 0
     call $~lib/rt/itcms/__link
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=8
     local.get $0
     local.get $8
     i32.store offset=12
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=8
     global.get $~lib/memory/__stack_pointer
     local.get $0
     i32.store offset=12
     local.get $0
     local.get $0
     i32.load offset=20
     i32.store offset=16
     global.get $~lib/memory/__stack_pointer
     i32.const 16
     i32.add
     global.set $~lib/memory/__stack_pointer
    end
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.load offset=8
    local.tee $3
    i32.store offset=8
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store offset=4
    local.get $0
    local.get $0
    i32.load offset=16
    local.tee $4
    i32.const 1
    i32.add
    i32.store offset=16
    local.get $3
    local.get $4
    i32.const 12
    i32.mul
    i32.add
    local.tee $3
    local.get $1
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $2
    i32.store
    local.get $3
    local.get $2
    i32.store offset=4
    local.get $0
    local.get $2
    i32.const 1
    call $~lib/rt/itcms/__link
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store offset=4
    local.get $0
    local.get $0
    i32.load offset=20
    i32.const 1
    i32.add
    i32.store offset=20
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store
    local.get $0
    i32.load
    local.set $1
    global.get $~lib/memory/__stack_pointer
    local.get $0
    i32.store
    local.get $3
    local.get $1
    local.get $9
    local.get $0
    i32.load offset=4
    i32.and
    i32.const 2
    i32.shl
    i32.add
    local.tee $0
    i32.load
    i32.store offset=8
    local.get $0
    local.get $3
    i32.store
   end
   global.get $~lib/memory/__stack_pointer
   i32.const 12
   i32.add
   global.set $~lib/memory/__stack_pointer
   return
  end
  i32.const 34784
  i32.const 34832
  i32.const 1
  i32.const 1
  call $~lib/builtins/abort
  unreachable
 )
 (func $~lib/staticarray/StaticArray<usize>#__set (param $0 i32) (param $1 i32) (param $2 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.sub
  global.set $~lib/memory/__stack_pointer
  global.get $~lib/memory/__stack_pointer
  i32.const 1992
  i32.lt_s
  if
   i32.const 34784
   i32.const 34832
   i32.const 1
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.store
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
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
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  local.get $1
  i32.const 2
  i32.shl
  i32.add
  local.get $2
  i32.store
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $assembly/index/allocateBuffer (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 12
  i32.sub
  global.set $~lib/memory/__stack_pointer
  global.get $~lib/memory/__stack_pointer
  i32.const 1992
  i32.lt_s
  if
   i32.const 34784
   i32.const 34832
   i32.const 1
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.store offset=8
  global.get $~lib/memory/__stack_pointer
  local.get $1
  i32.const 2
  i32.shl
  call $~lib/arraybuffer/ArrayBuffer#constructor
  local.tee $2
  i32.store
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/index/sampleBuffers
  local.tee $3
  i32.store offset=4
  global.get $~lib/memory/__stack_pointer
  local.get $2
  i32.store offset=8
  local.get $3
  local.get $0
  local.get $2
  call $"~lib/map/Map<i32,~lib/arraybuffer/ArrayBuffer>#set"
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/index/trackBufferPtrs
  local.tee $3
  i32.store offset=4
  local.get $3
  local.get $0
  local.get $2
  call $~lib/staticarray/StaticArray<usize>#__set
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/index/trackBufferLens
  local.tee $3
  i32.store offset=4
  local.get $3
  local.get $0
  local.get $1
  call $~lib/staticarray/StaticArray<usize>#__set
  global.get $~lib/memory/__stack_pointer
  i32.const 12
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $2
 )
 (func $~lib/staticarray/StaticArray<assembly/index/Voice>#__get (param $0 i32) (param $1 i32) (result i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.sub
  global.set $~lib/memory/__stack_pointer
  global.get $~lib/memory/__stack_pointer
  i32.const 1992
  i32.lt_s
  if
   i32.const 34784
   i32.const 34832
   i32.const 1
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
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
  global.get $~lib/memory/__stack_pointer
  local.get $0
  local.get $1
  i32.const 2
  i32.shl
  i32.add
  i32.load
  local.tee $0
  i32.store offset=4
  local.get $0
  i32.eqz
  if
   i32.const 1840
   i32.const 1104
   i32.const 82
   i32.const 40
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $0
 )
 (func $assembly/index/spawnGrain (param $0 i32) (param $1 f32) (param $2 f32) (param $3 f32) (param $4 f32) (param $5 f32) (param $6 f32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 12
  i32.sub
  global.set $~lib/memory/__stack_pointer
  block $folding-inner2
   block $folding-inner1
    block $folding-inner0
     global.get $~lib/memory/__stack_pointer
     i32.const 1992
     i32.lt_s
     br_if $folding-inner0
     global.get $~lib/memory/__stack_pointer
     i64.const 0
     i64.store
     global.get $~lib/memory/__stack_pointer
     i32.const 0
     i32.store offset=8
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/index/trackBufferLens
     local.tee $8
     i32.store
     global.get $~lib/memory/__stack_pointer
     i32.const 4
     i32.sub
     global.set $~lib/memory/__stack_pointer
     global.get $~lib/memory/__stack_pointer
     i32.const 1992
     i32.lt_s
     br_if $folding-inner0
     global.get $~lib/memory/__stack_pointer
     i32.const 0
     i32.store
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $0
     local.get $8
     i32.const 20
     i32.sub
     i32.load offset=16
     i32.const 2
     i32.shr_u
     i32.ge_u
     br_if $folding-inner1
     local.get $8
     local.get $0
     i32.const 2
     i32.shl
     i32.add
     i32.load
     local.set $10
     global.get $~lib/memory/__stack_pointer
     i32.const 4
     i32.add
     global.set $~lib/memory/__stack_pointer
     local.get $10
     i32.const 2
     i32.lt_s
     br_if $folding-inner2
     i32.const -1
     local.set $8
     loop $for-loop|0
      local.get $7
      i32.const 64
      i32.lt_s
      if
       block $for-break0
        global.get $~lib/memory/__stack_pointer
        global.get $assembly/index/voices
        local.tee $9
        i32.store offset=4
        local.get $9
        local.get $7
        call $~lib/staticarray/StaticArray<assembly/index/Voice>#__get
        local.set $9
        global.get $~lib/memory/__stack_pointer
        local.get $9
        i32.store
        local.get $9
        i32.load8_u
        i32.eqz
        if
         local.get $7
         local.set $8
         br $for-break0
        end
        local.get $7
        i32.const 1
        i32.add
        local.set $7
        br $for-loop|0
       end
      end
     end
     local.get $8
     i32.const -1
     i32.eq
     br_if $folding-inner2
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/index/voices
     local.tee $7
     i32.store
     global.get $~lib/memory/__stack_pointer
     local.get $7
     local.get $8
     call $~lib/staticarray/StaticArray<assembly/index/Voice>#__get
     local.tee $8
     i32.store offset=8
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
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $8
     i32.const 1
     i32.store8
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $8
     local.get $0
     i32.store offset=4
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/index/trackBufferPtrs
     local.tee $7
     i32.store offset=4
     global.get $~lib/memory/__stack_pointer
     i32.const 4
     i32.sub
     global.set $~lib/memory/__stack_pointer
     global.get $~lib/memory/__stack_pointer
     i32.const 1992
     i32.lt_s
     br_if $folding-inner0
     global.get $~lib/memory/__stack_pointer
     i32.const 0
     i32.store
     global.get $~lib/memory/__stack_pointer
     local.get $7
     i32.store
     local.get $0
     local.get $7
     i32.const 20
     i32.sub
     i32.load offset=16
     i32.const 2
     i32.shr_u
     i32.ge_u
     br_if $folding-inner1
     local.get $7
     local.get $0
     i32.const 2
     i32.shl
     i32.add
     i32.load
     local.set $0
     global.get $~lib/memory/__stack_pointer
     i32.const 4
     i32.add
     global.set $~lib/memory/__stack_pointer
     local.get $8
     local.get $0
     i32.store offset=8
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $8
     local.get $10
     i32.store offset=12
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $8
     local.get $1
     local.get $10
     f32.convert_i32_s
     f32.mul
     f32.store offset=16
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $8
     f32.const 0
     f32.store offset=20
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $8
     local.get $3
     f32.store offset=28
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $8
     local.get $4
     f32.store offset=32
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $8
     i32.const 0
     i32.store8 offset=40
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $8
     f32.const 1
     f32.store offset=44
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $2
     local.get $6
     f32.mul
     f64.promote_f32
     f64.floor
     f32.demote_f64
     local.tee $1
     f32.const 128
     f32.lt
     if
      f32.const 128
      local.set $1
     end
     local.get $8
     local.get $1
     f32.store offset=24
     global.get $~lib/memory/__stack_pointer
     local.get $8
     i32.store
     local.get $8
     f32.const 4095
     local.get $1
     f32.div
     f32.store offset=36
     br $folding-inner2
    end
    i32.const 34784
    i32.const 34832
    i32.const 1
    i32.const 1
    call $~lib/builtins/abort
    unreachable
   end
   i32.const 1360
   i32.const 1104
   i32.const 78
   i32.const 41
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 12
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $assembly/index/process (param $0 f32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 f32)
  (local $6 i32)
  (local $7 f64)
  (local $8 f32)
  (local $9 f32)
  (local $10 f32)
  (local $11 i32)
  (local $12 f32)
  (local $13 f32)
  (local $14 i32)
  (local $15 i32)
  (local $16 f32)
  (local $17 i32)
  (local $18 f32)
  global.get $~lib/memory/__stack_pointer
  i32.const 12
  i32.sub
  global.set $~lib/memory/__stack_pointer
  global.get $~lib/memory/__stack_pointer
  i32.const 1992
  i32.lt_s
  if
   i32.const 34784
   i32.const 34832
   i32.const 1
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.store offset=8
  global.get $assembly/index/PTR_OUTPUT_START
  i32.const 0
  i32.const 32768
  memory.fill
  loop $for-loop|0
   local.get $4
   i32.const 64
   i32.lt_s
   if
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/index/voices
    local.tee $1
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $1
    local.get $4
    call $~lib/staticarray/StaticArray<assembly/index/Voice>#__get
    local.tee $11
    i32.store offset=4
    global.get $~lib/memory/__stack_pointer
    local.get $11
    i32.store
    block $for-continue|0
     local.get $11
     i32.load8_u
     i32.eqz
     br_if $for-continue|0
     global.get $~lib/memory/__stack_pointer
     local.get $11
     i32.store
     local.get $11
     i32.load offset=8
     local.set $2
     global.get $~lib/memory/__stack_pointer
     local.get $11
     i32.store
     local.get $11
     i32.load offset=12
     local.tee $14
     i32.const 2
     i32.lt_s
     if
      global.get $~lib/memory/__stack_pointer
      local.get $11
      i32.store
      local.get $11
      i32.const 0
      i32.store8
      br $for-continue|0
     end
     global.get $~lib/memory/__stack_pointer
     local.get $11
     i32.store
     local.get $11
     f32.load offset=28
     local.set $5
     global.get $~lib/memory/__stack_pointer
     local.get $11
     i32.store
     local.get $11
     f32.load offset=36
     local.set $8
     global.get $~lib/memory/__stack_pointer
     local.get $11
     i32.store
     local.get $11
     f32.load offset=24
     local.set $9
     global.get $~lib/memory/__stack_pointer
     local.get $11
     i32.store
     local.get $11
     f32.load offset=16
     local.set $10
     global.get $~lib/memory/__stack_pointer
     local.get $11
     i32.store
     global.get $assembly/index/PTR_OUTPUT_START
     local.get $11
     i32.load offset=4
     i32.const 10
     i32.shl
     i32.add
     local.set $6
     local.get $5
     f32.const 1.2000000476837158
     f32.gt
     local.tee $1
     i32.eqz
     if
      local.get $5
      f32.const 0.800000011920929
      f32.lt
      local.set $1
     end
     i32.const 0
     local.set $3
     loop $for-loop|1
      local.get $3
      i32.const 128
      i32.lt_s
      if
       block $for-break1
        global.get $~lib/memory/__stack_pointer
        local.get $11
        i32.store
        local.get $9
        local.get $11
        f32.load offset=20
        f32.le
        if
         global.get $~lib/memory/__stack_pointer
         local.get $11
         i32.store
         local.get $11
         i32.const 0
         i32.store8
         br $for-break1
        end
        global.get $~lib/memory/__stack_pointer
        local.get $11
        i32.store
        local.get $10
        local.get $11
        f32.load offset=20
        local.get $5
        f32.mul
        f32.add
        local.set $0
        local.get $14
        f32.convert_i32_s
        local.set $12
        loop $while-continue|2
         local.get $0
         local.get $12
         f32.ge
         if
          local.get $0
          local.get $12
          f32.sub
          local.set $0
          br $while-continue|2
         end
        end
        loop $while-continue|3
         local.get $0
         f32.const 0
         f32.lt
         if
          local.get $0
          local.get $14
          f32.convert_i32_s
          f32.add
          local.set $0
          br $while-continue|3
         end
        end
        local.get $0
        local.get $0
        i32.trunc_sat_f32_s
        local.tee $15
        f32.convert_i32_s
        f32.sub
        local.set $16
        local.get $1
        if (result f32)
         local.get $2
         local.get $15
         i32.const 2
         i32.add
         local.tee $17
         local.get $14
         i32.sub
         local.get $17
         local.get $14
         local.get $17
         i32.le_s
         select
         i32.const 2
         i32.shl
         i32.add
         f32.load
         local.tee $0
         local.get $2
         local.get $15
         i32.const 1
         i32.sub
         local.tee $17
         i32.const 0
         i32.lt_s
         if (result i32)
          local.get $14
          local.get $17
          i32.add
         else
          local.get $17
         end
         i32.const 2
         i32.shl
         i32.add
         f32.load
         local.tee $12
         f32.sub
         f64.promote_f32
         f64.const 0.5
         f64.mul
         local.get $2
         local.get $15
         i32.const 2
         i32.shl
         i32.add
         f32.load
         local.tee $18
         local.get $2
         local.get $15
         i32.const 1
         i32.add
         local.tee $15
         local.get $14
         i32.ge_s
         if (result i32)
          local.get $15
          local.get $14
          i32.sub
         else
          local.get $15
         end
         i32.const 2
         i32.shl
         i32.add
         f32.load
         local.tee $13
         f32.sub
         f64.promote_f32
         f64.const 1.5
         f64.mul
         f64.add
         local.get $16
         f64.promote_f32
         local.tee $7
         f64.mul
         local.get $12
         local.get $18
         f32.const 2.5
         f32.mul
         f32.sub
         local.get $13
         local.get $13
         f32.add
         f32.add
         local.get $0
         f32.const 0.5
         f32.mul
         f32.sub
         f64.promote_f32
         f64.add
         local.get $7
         f64.mul
         local.get $13
         local.get $12
         f32.sub
         f64.promote_f32
         f64.const 0.5
         f64.mul
         f64.add
         local.get $7
         f64.mul
         local.get $18
         f64.promote_f32
         f64.add
         f32.demote_f64
        else
         local.get $2
         local.get $15
         i32.const 2
         i32.shl
         i32.add
         f32.load
         local.tee $0
         local.get $16
         local.get $2
         local.get $15
         i32.const 1
         i32.add
         local.tee $15
         i32.const 0
         local.get $14
         local.get $15
         i32.gt_s
         select
         i32.const 2
         i32.shl
         i32.add
         f32.load
         local.get $0
         f32.sub
         f32.mul
         f32.add
        end
        global.get $~lib/memory/__stack_pointer
        local.get $11
        i32.store
        global.get $assembly/index/PTR_LUT
        i32.const 4095
        local.get $11
        f32.load offset=20
        local.get $8
        f32.mul
        i32.trunc_sat_f32_s
        local.tee $15
        local.get $15
        i32.const 4096
        i32.ge_s
        select
        i32.const 2
        i32.shl
        i32.add
        f32.load
        f32.mul
        global.get $~lib/memory/__stack_pointer
        local.get $11
        i32.store
        local.get $11
        f32.load offset=32
        f32.mul
        local.set $0
        global.get $~lib/memory/__stack_pointer
        local.get $11
        i32.store
        local.get $3
        i32.const 2
        i32.shl
        local.tee $15
        local.get $6
        i32.add
        local.tee $17
        local.get $17
        f32.load
        local.get $0
        local.get $11
        f32.load offset=44
        f32.mul
        local.tee $0
        f32.add
        f32.store
        local.get $6
        i32.const 512
        i32.add
        local.get $15
        i32.add
        local.tee $15
        local.get $15
        f32.load
        local.get $0
        f32.add
        f32.store
        global.get $~lib/memory/__stack_pointer
        local.get $11
        i32.store
        global.get $~lib/memory/__stack_pointer
        local.get $11
        i32.store offset=8
        local.get $11
        local.get $11
        f32.load offset=20
        f32.const 1
        f32.add
        f32.store offset=20
        local.get $3
        i32.const 1
        i32.add
        local.set $3
        br $for-loop|1
       end
      end
     end
    end
    local.get $4
    i32.const 1
    i32.add
    local.set $4
    br $for-loop|0
   end
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 12
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $~lib/arraybuffer/ArrayBuffer#constructor (param $0 i32) (result i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.sub
  global.set $~lib/memory/__stack_pointer
  global.get $~lib/memory/__stack_pointer
  i32.const 1992
  i32.lt_s
  if
   i32.const 34784
   i32.const 34832
   i32.const 1
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.store
  local.get $0
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 1056
   i32.const 1568
   i32.const 52
   i32.const 43
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.const 1
  call $~lib/rt/itcms/__new
  local.tee $0
  i32.store
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $0
 )
)
