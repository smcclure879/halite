

import  qualified Data.Map as M
--import Data.Dynamic 



data VV = S String | I Integer  |  B Bag    --ordered list use bag with index "1","2","3" etc
  deriving(Show)
type Bag = M.Map String VV
bag :: M.Map String VV   -- should be: string valType  so can be string or int ?
bag = M.empty

--patient :: () -> Bag
patient = M.insert "type" (S "patient") bag

main = do
  let kdrugs = M.insert "promemethanon" (S "blah blah") bag
  let karen = M.insert "drugs" (B kdrugs) patient
  putStrLn $ show $ karen
 
{-
myMap :: M.Map Int String
myMap = M.fromList bugbugoops zip [1..10] ["abcdefghij"]

insertedMap :: M.Map Int String
insertedMap = M.insert 11 "fizzbuzz" myMap

at11 :: Maybe String
at11 = M.lookup 11 insertedMap

main = do
  putStrLn (show $ M.lookup 15 myMap)



data VV =  D Dynamic | B Bag  
  deriving(Show)

type Bag = M.Map String VV
bag :: M.Map String VV   -- should be: string valType  so can be string or int ?
bag = M.empty

main = do
  let karen = M.insert "bloodPressure" (D (Dynamic 180)) bag
  putStrLn $ show $ karen

-}

-- that obj will not nest.

{-

data Tree a = Empty a | Branch a (Tree a) (Tree a)
              deriving (Show, Eq)
obj :: Tree Bag
obj = Empty bag

patient :: Tree Bag
patient =  Branch (M.insert "type" (toDyn "patient")  bag)   (Empty bag)   (Empty bag)

main = do
  putStrLn $ show patient
  putStrLn $ show bag
--  let karen = patient
--  putStrLn $ show karen


-}
---------------comb--------------------
          
{-













  

class Predicate pred where
  originalText ::  -> String
    ,acc :: [Maybe String]
    ,lamb :: Obj -> Trin

data Predicate = Predicate {
  originalText::String  -- clipped, to help debugging, but mainly use instead of failText
  ,acc :: Patient2 -> 
  ,lamb :: Patient2 -> Bool
}




karen = M.insert "bloodPressure" 180  .  M.new 

predicate49 = Predicate {
  originalText="bp greater than 150"
  ,parent=Nothing
  --,lamb = \pt -> (bloodPressure pt) > Just 150 
  ,lamb = (> Just 150) . bloodPressure
}

assert No can karen predicate47



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

-}
















{-import qualified Data.HashTable.ST as H

bugbug how to get library, why something so simple as a 


type HashTable k v = H.BasicHashTable k v

foo :: IO (HashTable Int Int)
foo = do
    ht <- H.new
    H.insert ht 1 1
    return ht

main = putStrLn foo
--Essentially, anywhere you see IOHashTable h k v in the type signatures below, you can plug in any of BasicHashTable k v, CuckooHashTable k v, or LinearHashTable k v.


-}










----trinaryWithReasons------------
-- we want to return WHY it passed failed etc.

data Trit = Yes | No | Unk | Untrans   deriving(Show,Eq)
data Trin = Trin Trit String           deriving(Show)


getTrit :: Trin -> Trit
getTrit ( Trin a _ ) = a
-- getTritb :: Bool -> Trit
-- getTritb False = Yes
-- getTritb True = No


---assertions------------------------
assert3:: Trit -> (a -> b -> Trin) -> a -> b -> IO ()
assert3  expected      verb           pt pred =
  do
    let result = verb pt pred
    let tr = getTrit result
    let text = if ( tr == expected )
               then "assertion worked??bugbug"
               else "assert2 bugbug"
    putStrLn text
    
-- test ---

--These should actually be complex objects one that queries the other!, not ints!
marco = 5
trialNo = 33

can _ _ = Trin Yes "by design"
--main = do
--  assert3 No can marco trialNo
    

-----------------------------------



--data Patient = some kinda hashtable
















-------------------------------
{-


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
-}
