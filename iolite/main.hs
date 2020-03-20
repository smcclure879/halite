

----trinaryWithReasons------------
-- we want to return WHY it passed failed etc.

data Trit = Yes | No | Unk | Untrans   deriving(Show)
data Trin = Trin Trit String           deriving(Show)


{-  if we had all patientss have all fields -}
--(<&) :: Ord(a) => Maybe a -> a -> Bool
Just x   <&   y     =   x < y
Nothing  <&  _      =   False
--x  <&  y            =   (x < y)


---assertions------------------------
assert3:: Trit -> (Patient -> Predicate -> Trin) -> Patient -> Predicate -> IO ()
assert3  expected verb pt pred = do
                let result = verb pt pred
                case result of
                     Trin expected a -> putStrLn "assertion worked??bugbug"
                     --otherwise -> putStrLn "assert2 bugbug"
                     --bugbug did I even get this far??

-- e.g.  assert3 No can marco trial33
-----------------------------------

data Patient = Patient { 
  first :: String
  ,bloodPressure :: Maybe Int
} deriving (Show)

karen = Patient { 
  first = "karen"
  ,bloodPressure = Just 180 
}

stan = Patient {
  first = "stan"
  ,bloodPressure = Nothing  --not yet measured
}

marco = Patient {
  first = "marco"
  ,bloodPressure = Just 100
}

data TextRef = TextRef {
  hash::String,
  nct::String,
  start::Int,
  end::Int
}
  

-- x decideable(x) can decide Y/N/? something about x
--class Decideable dec  where 
--  can :: x dec -> Trin
  --can pt dec = dec pt


data Predicate = Predicate {
  originalText::String  -- clipped, to help debugging, but mainly use instead of failText
  ,parent :: Maybe (Predicate )
  --,hTextD::TextRef 
  --,contextD::String   --the path above here
  --,myContextD:: String
  --,failText :: String  --what to add
  --,lam :: Patient -> Trin
  --,accessor :: Patient -> a
  ,lamb :: Patient -> Bool
}

reasonWhy pred pt = 
    Trin Yes ("one reason is: " ++ (originalText pred))
reasonWhyNot pred pt = 
    Trin No ("failed original text: " ++ originalText pred)
reasonUnk pred pt = 
    Trin Unk ("incomplete data for pt: " ++ originalText pred)

--can pt pred = lam pred pt
can :: Patient -> Predicate  -> Trin
can pt pred = do
  let lam=lamb pred;
  if (lam pt) 
    then reasonWhy pred pt
    else reasonWhyNot pred pt


--bugbug hwere i am at: need to check that we can get pt bp 
--  before we call the lambda.  different type of NO and reason
{-
can2 :: Patient -> Predicate  -> Trin
can2 pt pred = do
  let lam = lamb pred
  let acc = accessor pred
  let valOfAcc = acc pt
  case valOfAcc of
      Nothing -> Trin Unk $ show valOfAcc
      otherwise -> can pt pred
--bugbug think i got to place where I just want it to be a hashtable.  strong typing for patients and predicates doesn't make sense.
-}

predicate49 = Predicate {
  originalText="bp greater than 150"
  ,parent=Nothing
  --,lamb = \pt -> (bloodPressure pt) > Just 150 
  ,lamb = (> Just 150) . bloodPressure
}

predicate50 = Predicate {
  originalText = "bp greater than 150"  
               --(within a context "must not have")
  ,parent = Just predicate49
  ,lamb = (> Just 150) . bloodPressure
}

{-
predicate51 = Predicate {
  originalText = "bp less than 150"
  ,parent = Nothing
  ,accessor= bloodPressure
  ,lamb =  (<  150) .  accessor this
  --bugbug if no bp, then should return UNK something here
}
-}

{- want something like this happeing
predicate52 = Predicate {  reason="reasoncode:
         N14578913/AND/split-333/king-47-51/AND/kin   , originalText: blood pressure greater than 150" 
}
-}



newtype RawString = RawString String 
  deriving (Show)
rawTrial47 = RawString "Blood Pressure over 150"

myshow a = putStrLn $ show a
main = do
  myshow $ can karen predicate49

  {-myshow $ assert3 Unk can karen predicate49
  myshow $ assert3 No  can2 stan  predicate50
  myshow $ assert3 Yes can2 marco predicate50
  myshow $ assert3 No  can2 marco predicate51
  myshow $ assert3 Unk can2 karen predicate51
  -}
  putStrLn "done"

