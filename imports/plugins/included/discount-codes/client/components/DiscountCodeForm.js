import React, { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import i18next from "i18next";
import { useApolloClient, useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "notistack";
import SimpleSchema from "simpl-schema";
import _ from "lodash";
import { Button, TextField, ConfirmDialog } from "@reactioncommerce/catalyst";
import {
  FormLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  makeStyles,
  MenuItem,
  Checkbox,
  Typography,
  FormGroup,
  FormControlLabel
} from "@material-ui/core";
import muiOptions from "reacto-form/cjs/muiOptions";
import useReactoForm from "reacto-form/cjs/useReactoForm";
import createDiscountCodeGQL from "../graphql/mutations/createDiscountCode";
import deleteDiscountCodeGQL from "../graphql/mutations/deleteDiscountCode";
import updateDiscountCodeGQL from "../graphql/mutations/updateDiscountCode";

const useStyles = makeStyles((theme) => ({
  deleteButton: {
    marginRight: "auto"
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 500
  },
  legend: {
    marginBottom: theme.spacing(1)
  }
}));

const discountCodeSchema = new SimpleSchema({
  "code": {
    type: String
  },
  "calculation": Object,
  "calculation.method": {
    type: String
  },
  "conditions": {
    type: Object,
    optional: true
  },
  "conditions.enabled": {
    type: Boolean,
    optional: true,
    defaultValue: true
  },
  "conditions.accountLimit": {
    type: Number,
    optional: true
  },
  "conditions.redemptionLimit": {
    type: Number,
    optional: true
  },
  "conditions.products": {
    type: Array,
    optional: true
  },
  "conditions.products.$": {
    type: String,
    optional: true
  },
  "description": {
    type: String,
    optional: true
  },
  "discount": {
    type: String
  },
  "discountMethod": {
    type: String,
    defaultValue: "code"
  }
});
const validator = discountCodeSchema.getFormValidator();

/**
 * @summary React component that renders the form for adding, updating, or deleting
 *   a discount code record.
 * @param {Object} props React props
 * @return {React.Node} React node
 */
export default function DiscountCodeForm(props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  //const [hasChanges, setHasChanges] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  
  const apolloClient = useApolloClient();

  //const [onceThru, setOnceThru] = useState(false);

  const { discountCode, isCreateMode, isOpen, onCloseDialog, refetch, shopId, productsData, isInitLoad, setIsInitLoad } = props;

  //console.log({productsData});

  const calculationMethods = [
    { label: "Credit", value: "credit" },
    { label: "Discount", value: "discount" },
    { label: "Sale", value: "sale" },
    { label: "Shipping", value: "shipping" }
  ];

  const onSuccess = () => {
    setIsSubmitting(false);
    refetch();
    onCloseDialog();
  };

  const onFailure = () => {
    setIsSubmitting(false);
    onCloseDialog();
    enqueueSnackbar(i18next.t("admin.discountCode.failure"), { variant: "warning" });
  };

  const [createDiscountCode] = useMutation(createDiscountCodeGQL, {
    ignoreResults: true,
    onCompleted() {
      onSuccess();
      enqueueSnackbar(i18next.t("admin.discountCode.createSuccess"), { variant: "success" });
    },
    onError() {
      onFailure();
    }
  });

  const [deleteDiscountCode] = useMutation(deleteDiscountCodeGQL, {
    ignoreResults: true,
    onCompleted() {
      onSuccess();
      enqueueSnackbar(i18next.t("admin.discountCode.deleteSuccess"), { variant: "success" });
    },
    onError() {
      onFailure();
    }
  });

  const [updateDiscountCode] = useMutation(updateDiscountCodeGQL, {
    ignoreResults: true,
    onCompleted() {
      onSuccess();
      enqueueSnackbar(i18next.t("admin.discountCode.updateSuccess"), { variant: "success" });
    },
    onError() {
      onFailure();
    }
  });

  const {
    getFirstErrorMessage,
    getInputProps,
    isDirty,
    hasErrors,
    submitForm
  } = useReactoForm({
    async onSubmit(formData) {
      setIsSubmitting(true);  
      
      let activeIds = [];
      /*for (const condition in conditionsState) {
        console.log({condition});
        if (condition.active) {
          activeIds.push(condition.id);
        }
      }*/
      conditionsState.map((condition) => {
        if (condition.active) {
          activeIds.push(condition.id);
        }
      });
      //console.log(conditionsState.find(i => i.active === true));
      //console.log({activeIds});
  
      //console.log({formData});
      

      if (discountCode) {
        const discountCodeInput = discountCodeSchema.clean(formData);
        if (discountCodeInput.conditions) {
          // Set order minimum to 0, this will allow a discount to be
          // Redeemed infinitely on any number of orders.
          _.set(discountCodeInput, "conditions.order.min", 0);
        }
        if (activeIds.length) {
          _.set(discountCodeInput, "conditions.products", activeIds);
        } else {
          _.set(discountCodeInput, "conditions.products", []);
        }
        await updateDiscountCode({
          variables: {
            input: {
              discountCode: discountCodeInput,
              discountCodeId: discountCode._id,
              shopId
            }
          }
        });
      } else {
        // Create a new discount code
        const discountCodeInput = discountCodeSchema.clean(formData);
        if (discountCodeInput.conditions) {
          // Set order minimum to 0, this will allow a discount to be
          // Redeemed infinitely on any number of orders.
          _.set(discountCodeInput, "conditions.order.min", 0);
        } // TODO: add set activeIds
        if (activeIds.length) {
          _.set(discountCodeInput, "conditions.products", activeIds);
        } else {
          _.set(discountCodeInput, "conditions.products", []);
        }

        await createDiscountCode({
          variables: {
            input: {
              discountCode: discountCodeInput,
              shopId
            }
          }
        });
      }
    },
    validator(formData) {
      return validator(discountCodeSchema.clean(formData));
    },
    value: discountCode,
    logErrorsOnSubmit: true
  });

  let calculationMethodField;
  if (Array.isArray(calculationMethods) && calculationMethods.length) {
    const options = calculationMethods.map(({ value, label }) => ({ label, value }));
    calculationMethodField = (
      <TextField
        error={hasErrors(["calculation.method"])}
        fullWidth
        helperText={getFirstErrorMessage(["calculation.method"])}
        label={i18next.t("admin.discountCode.form.calculationMethod")}
        onKeyPress={(event) => {
          if (event.key === "Enter") submitForm();
        }}
        select
        {...getInputProps("calculation.method", muiOptions)}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }


  

  //console.log({productsData});

  let initConditions = JSON.parse(JSON.stringify(productsData));
  const [conditionsState, setConditionsState] = useState(initConditions);

  useEffect(() => {
    let initConditions = JSON.parse(JSON.stringify(productsData));
    setConditionsState(initConditions);
  }, [productsData]);

  useEffect(() => {
    //console.log('component did mount');
    //console.log(isInitLoad);
    
    const inputConditions = getInputProps("conditions", muiOptions);
    //console.log({inputConditions});
    
    if (inputConditions.value.products && isInitLoad) {
      
      //console.log('first render');
      //if (conditionsState.length) {
      //console.log(inputConditions.value.products); //.length);
      if (inputConditions.value.products && inputConditions.value.products.length) {
        /*let stateToUpdate = [...conditionsState];
        let objToUpdate = stateToUpdate.find(i => i.title == 'DIN Cable');
        if (objToUpdate.active = false) {
          objToUpdate.active = !objToUpdate.active;
          setConditionsState(stateToUpdate);
        }*/
        //TODO: loop thru inputConditions.value.products and set active states on initConditions
        let initConditions = JSON.parse(JSON.stringify(productsData));
        inputConditions.value.products.map((id) => {
          objToActivate = initConditions.find(i => i.id == id);
          if (objToActivate) {
            objToActivate.active = true;   
          } else {
            console.log('id not found: ' + id);
          }
        });
        setConditionsState(initConditions);
      } else {
        let initConditions = JSON.parse(JSON.stringify(productsData));
        setConditionsState(initConditions);
      }
      setIsInitLoad(false);
    } 
  });


  const handleCheckboxSelect = (event) => {
    ////console.log(event.target.name);
    //console.log(conditionsState.find(i => i.id === event.target.name));
    let stateToUpdate = [...conditionsState];
    let objToUpdate = stateToUpdate.find(i => i.id === event.target.name);
    objToUpdate.active = !objToUpdate.active;
    setConditionsState(stateToUpdate);
    /*setConditionsState({
      ...conditionsState,
      {'id': event.target.name , 'active': event.target.checked }
    });*/
    //console.log(conditionsState);
    //console.log({productsData});
    /*if (conditionsState == JSON.parse(JSON.stringify(productsData))) {
      setHasChanges(false);
    } else {
      setHasChanges(true);
    }*/
  };



  let discountConditionsItemsField;

  if (Array.isArray(productsData)) {
    const items = [...productsData];
    //console.log(...getInputProps("conditions.redemptionLimit", muiOptions));
    if (productsData && Array.isArray(productsData) && productsData[0] && Array.isArray(conditionsState) && conditionsState[0]) {
      discountConditionsItemsField = (
        <FormGroup>
        {items.map((item, idx) => {
          return ( 
            <FormControlLabel
              key={idx}
              control={<Checkbox 
                checked={conditionsState.find(i => i.id === item.id).active}
                onChange={handleCheckboxSelect}
                name={item.id}
              />}
              label={item.title}
            />
          );
        })}
        </FormGroup>
      ); 
    }
  }
  

  /*const onCloseHijack = () => {
    console.log('on close hijack');
    console.log({conditionsState});
    console.log({productsData});
    let initConditions = JSON.parse(JSON.stringify(productsData));
    setConditionsState(initConditions);
    console.log({conditionsState});
    onCloseDialog();
  };*/
    
  const classes = useStyles();

  return (
    <div>
      <Dialog open={isOpen} onClose={onCloseDialog} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">
          <span className={classes.dialogTitle}>
            {i18next.t("admin.discountCode.addDiscountModalTitle")}
          </span>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                error={hasErrors(["code"])}
                fullWidth
                helperText={getFirstErrorMessage(["code"])}
                label={i18next.t("admin.discountCode.form.code")}
                placeholder={i18next.t("admin.discountCode.form.codePlaceholder")}
                {...getInputProps("code", muiOptions)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                error={hasErrors(["discount"])}
                fullWidth
                helperText={getFirstErrorMessage(["discount"])}
                label={i18next.t("admin.discountCode.form.discount")}
                placeholder={i18next.t("admin.discountCode.form.discountPlaceholder")}
                {...getInputProps("discount", muiOptions)}
              />
            </Grid>
            <Grid item xs={12}>
              {calculationMethodField}
            </Grid>
            <Grid item xs={12}>
              <FormLabel component="legend" classes={{ root: classes.legend }}>
                Conditions
              </FormLabel>
            </Grid>
            <Grid item xs={12}>
              <TextField
                error={hasErrors(["conditions.accountLimit"])}
                fullWidth
                helperText={getFirstErrorMessage(["conditions.accountLimit"])}
                label={i18next.t("admin.discountCode.form.accountLimit")}
                placeholder={i18next.t("admin.discountCode.form.accountLimitPlaceholder")}
                {...getInputProps("conditions.accountLimit", muiOptions)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                error={hasErrors(["conditions.redemptionLimit"])}
                fullWidth
                helperText={getFirstErrorMessage(["conditions.redemptionLimit"])}
                label={i18next.t("admin.discountCode.form.redemptionLimit")}
                onKeyPress={(event) => {
                  if (event.key === "Enter") submitForm();
                }}
                placeholder={i18next.t("admin.discountCode.form.redemptionLimitPlaceholder")}
                {...getInputProps("conditions.redemptionLimit", muiOptions)}
              />
            </Grid>
            <Grid item xs={12}>
              {discountConditionsItemsField}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          { !isCreateMode && (
            <ConfirmDialog
              title={i18next.t("admin.discountCode.form.deleteDialogTitle")}
              message={i18next.t("admin.discountCode.form.deleteMessage")}
              onConfirm={async () => {
                await deleteDiscountCode({
                  variables: {
                    input: {
                      shopId,
                      discountCodeId: discountCode._id
                    }
                  }
                });
              }}
            >
              {({ openDialog }) => (
                <Button
                  variant="text"
                  classes={{ root: classes.deleteButton }}
                  disabled={isSubmitting}
                  onClick={openDialog}
                  color="primary"
                >
                  {i18next.t("app.delete")}
                </Button>

              )}
            </ConfirmDialog>
          )}
          <Button variant="outlined" onClick={onCloseDialog} color="primary">
            {i18next.t("app.cancel")}
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={submitForm}
            variant="contained"
            color="primary"
          >
            {i18next.t("app.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

DiscountCodeForm.propTypes = {
  /**
   * A discount code record
   */
  discountCode: PropTypes.object,
  /**
   * Determines if the dialog is in create or edit mode
   */
  isCreateMode: PropTypes.bool,
  /**
   * Determines whether the form dialog is open or not
  */
  isOpen: PropTypes.bool,
  /**
   * Function that closes the form dialog
  */
  onCloseDialog: PropTypes.func,
  /**
   * Function to call after form is successfully submitted
   */
  refetch: PropTypes.func,
  /**
   * Shop ID to create/edit tax rate for
   */
  shopId: PropTypes.string
};
