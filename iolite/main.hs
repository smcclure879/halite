
---------ternaryOperator--------
data Cond a = a :? a

infixl 0 ?
infixl 1 :?

(?) :: Bool -> Cond a -> a
True  ? (x :? _) = x
False ? (_ :? y) = y
--putStrLn ( False ? "yup" :? "nope" )


----trinaryWithReasons------------
data Trin = Yes String | No String | Untrans String
                deriving(Show)
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
  ,parent :: Maybe Predicate  
  --,hTextD::TextRef 
  --,contextD::String   --the path above here
  --,myContextD:: String
  --,failText :: String  --what to add
  --,lam :: Patient -> Trin
  ,lamb :: Patient -> Bool
}

reasonWhy pred pt = 
    Yes ("one reason is: " ++ (originalText pred))
reasonWhyNot pred pt = 
    No ("failed original text: " ++ originalText pred)

--can pt pred = lam pred pt
can pt pred = if (lamb pred pt) 
  then reasonWhy pred pt
  else reasonWhyNot pred pt


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

predicate51 = Predicate {
  originalText = "bp greater than 150"
  ,parent = Nothing
  ,lamb = (> Just 150) . bloodPressure
}



--type Trial = Predicate 
{-
lam47 :: Patient -> Trin
lam47 = \pt ->
        (bloodPressure pt > Just 150) ? 
        Yes   :?   No
         "reason code:N14578913/AND/split-333/king-47-51/AND/kin   , originalText: blood pressure greater than 150" 
-}



newtype RawString = RawString String 
  deriving (Show)
rawTrial47 = RawString "Blood Pressure over 150"

myshow a = putStrLn $ show a
main = do
  --putStrLn "Hello World!"
  --myshow $ No "some reason bugbug"
  --myshow $ karen
  --myshow $ rawTrial47
  --myshow $ lam47 karen
  --myshow $ lam47 stan
  --myshow $ can stan lam47
  --myshow $ lamb predicate49 stan
  myshow $ can karen predicate49
  myshow $ can stan predicate50
  myshow $ can marco predicate50
  myshow $ can marco predicate51
  putStrLn "done"

