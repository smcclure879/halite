use strict;  #perl6


sub sgn($x){
    return 0 if $x==0;
    return 1 if $x>0;
    return -1;
}

my $parenLevel=0;
for lines() -> $_ {
    #say $_;
    #.perl;
    my @fields = $_.split( /\|/ , :g ) ;
    #my $spacing = @fields[0];
    #print($spacing x 3);
    my $newParenLevel = @fields[1];
    my $action = @fields[3] ~ @fields[4];


    
    #original text, but report would need to provide start/stops
    if (1) {
	my ($a,$b)=(@fields[6],@fields[7]);
	if ($b==-1) {
	    $b=fakeText().chars();  #fix all fakeTexts obviously  (bugbug)
	}
	my $c=$b-$a+1;
	my $origText = ($c>60) ?? "..." !! fakeText().substr($a,$c).trim();
	$action ~= "    $origText";
	
    }
    

    my $spacing = "      " x $newParenLevel;

    print($spacing);
    print($action);    

    
# implement as parens instead of indent... this didn't work quite right, please fix.
#    my $diff = $newParenLevel-$parenLevel;
#     my $sign = sgn($diff);
#     print ")\n"~$spacing~"(" if $sign == 0;
#     while ($diff != 0 ) {
# 	print( $sign ?? "(" !! ")\n" );
# 	$diff -= sgn($diff);
#     }



    
#     $parenLevel=$newParenLevel;
# */
    say "";
}



sub fakeText() {
    return "        Inclusion Criteria:

          -  Adenocarcinoma of the prostate, post radical-prostatectomy Detectable PSA

          -  ECOG/Zubrod Performance Status of 0-2

          -  Negative technetium 99-m MDP or F-18 PET bone scan for skeletal metastasis

          -  CT or MR scan of abdomen and pelvis which does not suggest presence of metastatic
             disease outside of the pelvis

          -  Willingness to undergo pelvic radiotherapy.

        Exclusion Criteria:

          -  Contraindications to radiotherapy (including active inflammatory bowel disease or
             prior pelvic XRT)

          -  Inability to undergo anti-3-[18F]FACBC PET-CT

          -  Age under 18

          -  Metastatic disease outside of pelvis on any imaging or biopsy

          -  Prior invasive malignancy (except non-melanomatous skin cancer) unless disease free
             for a minimum of 3 years

          -  Severe acute co-morbidity, defined as follows:

               -  Unstable angina and/or congestive heart failure requiring hospitalization in the
                  last 3 months

               -  Transmural myocardial infarction within the last 6 months

               -  Acute bacterial or fungal infection requiring intravenous antibiotics at the time
                  of registration

               -  Chronic Obstructive Pulmonary Disease exacerbation or other respiratory illness
                  requiring hospitalization or precluding study therapy at the time of registration

               -  Acquired Immune Deficiency Syndrome (AIDS) based upon current CDC definition;
                  note, however, that HIV testing is not required for entry into this protocol. The
                  need to exclude patients with AIDS from this protocol is necessary because the
                  treatments involved in this protocol may be significantly immunosuppressive.
                  Protocol-specific requirements may also exclude immunocompromised patients
      
";
}
