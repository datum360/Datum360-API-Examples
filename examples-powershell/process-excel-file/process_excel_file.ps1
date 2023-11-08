. .\functions.ps1
. .\variables.ps1

#####################################
# process Generic Example documents #
#####################################
#
# Instructions before running
# create two dirs Powershell & Files
# install .ps1 files to Powershell dir
# install all other files to Files dir
# edit your client id & secret (username & password to PIM360 in the variables file)
# edit variables in "Config settings" section if necessary
# run this script from the directory that it lives in
# make sure that your powershell version is at least 7

###################
# Config settings #
###################

[string]$Tag_Data = "Mechanical Equipment Test.xlsx"
[string]$Assoc_data = "Associations.txt"

[string]$Worksheet_name = "Sheet1"



write-host ""
write-host " # This script completes the folowwing " -fore green
write-host " # 1. Authorises access to PIM360" -fore green
write-host " # 2. Authorises access to CLS360" -fore green
write-host " # 3. Get The EIC Handle using the variable defined EIC number" -fore green
write-host " # 4. Checks to see if the deliverable is within the EIC , if not present then it will be created" -fore green
write-host " # 5. Get the domain Handle" -fore green
write-host " # 6. Get the ETL handle from CLS" -fore green
write-host " # 7. Uploads Tag file to EIC" -fore green
write-host " # 8. checks for Load completion" -fore green
write-host " # 9. Upload Association file" -fore green
write-host " # 10. Checks for Load completion" -fore green
write-host " # 11. Extracts a named Liveview" -fore green
write-host " # 12. Extracts the same Liveview as a Dataset" -fore green
write-host ""

$projdir = Split-Path -Parent $PSScriptRoot
$env:Path += ";$projdir\bin;"

$Files_dir = "$projdir\Files\"




####################
# Authorize API's  #
####################

Auth-PIM360
Auth-CLS360

#############################################
# Config and EIC and Extract Associations #
#############################################

# Get EIC unique ID
$eic_handle = Get_EIC_Hdl -eic $eic_Tag
"eic_handle : $eic_handle"
"ETL_name :$ETL_name"

#check if Deliverable exists if not then create it
$deliverble_handle = Get_EIC_Deliverable -EIC_hndl $eic_handle -Deliverable_name $ETL_name
if (-not $deliverble_handle ) { 
  write-host ""
  write-warning "no Deliverable  - creating one  "
  write-host ""
  $Response = EIC_create_del -Doc_name $ETL_name -eic_Hdl $eic_handle
  $deliverble_handle = $Response.Deliverables.Hdl
}
else { 
  write-warning "Deliverable exists - so re-using"
}
" Deliverble handle : $deliverble_handle"
write-host ""

# select class Library
$Domain_handle = Get-DomainForPIM360 
"Domain handle : $Domain_handle"
write-host ""

# get EIC Unique ID
$ETL_name_handle = Get-Source-Hdl -Domain_handle $Domain_handle -Source_name $ETL_name
"ETL Source handle for '$ETL_name' : $ETL_name_handle"


##############
# Load Tags  #
##############
write-host ""

pause

write-host ""
Write-Host "Loading Tags to EIC : $eic_Tag"
write-host ""

${Activity-Hdl} = upload-wide-file -Upload_file "${Files_dir}${Tag_Data}" -EIC_hndl $eic_handle  -object_type "TAGGED_ITEM" -Source_handle $ETL_name_handle -deliverble_handle $deliverble_handle -worksheet $Worksheet_name

#Looping until the activity is completed
Do {
  Start-Sleep -Seconds .5

  $Activity_status = Get-ActivityStatus -Activity ${Activity-Hdl}
  Write-Host "Activity status :$Activity_status"
  if ($Activity_status -eq 'ERROR') { 

    [System.Windows.MessageBox]::Show('EIC - failed to load Data')

    Write-Host "QUITING PROCESS as Activity status : $Activity_status"
    Break
  }
} while ( $Activity_status -ne 'COMPLETE' )
write-host ""
pause

#######################
# Load Associations   #
#######################

write-host ""
Write-Host "Loading associations to EIC : $eic_Tag"
write-host ""
# Upload Association and collect Handle
${Activity-Hdl} = upload-refs-file -Upload_file "${Files_dir}$Assoc_data" -eic_handle $eic_handle
# check activity until complete
Do {
  Start-Sleep -Seconds .5

  $Activity_status = Get-ActivityStatus -Activity ${Activity-Hdl}
  Write-Host "Activity status :$Activity_status"
  if ($Activity_status -eq 'ERROR') { 

    [System.Windows.MessageBox]::Show('EIC - failed to load refs')

    Write-Host "QUITING PROCESS as Activity status : $Activity_status"
    Break
  }
} while ( $Activity_status -ne 'COMPLETE' )


# Below : Data extraction Examples showing two methods
# 1. LiveView
# 2. Dataset 

####################
# Extract Liveview #
####################
$LiveView_Name = "Example Liveview"
$Dataset_Name = "Example_Dataset"

write-host ""
Write-Host "Extracting Liveview : '$LiveView_Name' "
write-host ""

# Create a Liveview on the EIC call it "Example Liveview"
# Export the liveview and also give it a dataset name of "Example_Dataset" ( note case sensitive and spaces not allowed in dataset name)
write-Host "****** User action required below ******" -fore red
write-Host "Create a Liveview on the EIC named '${LiveView_Name}' then manually export it with a dataset name of '${Dataset_Name}' then continue" -fore green
pause
Write-Host "Extracting Liveview Data"
write-host ""


# Extract Liveview
$Live_View_Data = Get-LiveViewDataByName -LiveView_Name $LiveView_Name

write-host ""
Write-Host "Following Table Data can be used in a Process or Exported to a file" -fore green
write-host ""

$Live_View_Data | format-table 


####################
# Extract Dataset  #
####################


# collect the dataset handle

$Dataset_Meta = Get-Dataset-Meta -Dataset_Name $Dataset_Name
$Dataset_Hdl = $Dataset_Meta.Hdl
"Datasheet Hdl : $Dataset_Hdl"

# Post dataset_Hdl to re-export the dataset to get the latest data
Write-Host ""
Write-Host "Extracting Liveview Data"
Write-Host ""

$Activity_Hdl = Post-Activity_Hdl -Activity_Hdl $Dataset_Hdl

 "Datasheet Activity Hdl:$Activity_Hdl"
 Write-Host ""
# check activity status until it is complete
Do {
  Start-Sleep -Seconds .5
  $Activity_status = Get-ActivityStatus -Activity ${Activity_Hdl}
  Write-Host "Activity status :$Activity_status"
  if ($Activity_status -eq 'ERROR') { 

    [System.Windows.MessageBox]::Show('Failed to Export Dataset')

    Write-Host "QUITING PROCESS as Activity status : $Activity_status"
    Break
  }
} while ( $Activity_status -ne 'COMPLETE' )

### get export file extension ( could have been csv, txt or xlsx)
$Response = Get-Activity_Hdl -Activity_Hdl ${Activity_Hdl}

$file_extension = $Response.params.export_mode
"file extension of export : $file_extension"
### download export file
Get-Dataset-File -Dataset_Name $Dataset_Name -Out_Dir $Files_dir -file_extension $file_extension 

write-host ""
Write-Host "File downloaded to ${Files_dir}${Dataset_Name}.${file_extension}" -fore green
write-host ""

