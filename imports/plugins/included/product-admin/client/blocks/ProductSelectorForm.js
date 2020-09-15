import React, { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";
import i18next from "i18next";
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  Box,
  makeStyles,
  IconButton
} from "@material-ui/core";
import CloseIcon from "mdi-material-ui/Close";
import PlusIcon from "mdi-material-ui/Plus";
import TextField from "@reactioncommerce/catalyst/TextField";
import SimpleSchema from "simpl-schema";
import clone from "clone";
import equal from "deep-equal";
import useProduct from "../hooks/useProduct";

const useStyles = makeStyles((theme) => ({
  card: {
    marginBottom: theme.spacing(2)
  },
  grid: {
    paddingBottom: theme.spacing(2)
  }
}));

const selectorSchema = new SimpleSchema({
  "selectorName": {
    type: String,
    max: 30
  },
  namespace: {
    type: String,
    max: 20,
    optional: true
  },
  scope: {
    type: String,
    optional: true
  },
  "selectorOptionsAsCSV": {
    type: String
  },
  valueType: {
    type: String,
    optional: true
  },
  description: {
    type: String,
    optional: true
  }
});

const formSchema = new SimpleSchema({
  "selectors": {
    type: Array,
    optional: true
  },
  "selectors.$": selectorSchema
});

const selectorValidator = selectorSchema.getFormValidator();

/**
 * Product selector form block component
 * @returns {Node} React component
 */
function ProductSelectorForm() {
  const classes = useStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setDirty] = useState(false);
  const [selectors, setSelectors] = useState([]);
  const [newSelector, setNewSelector] = useState({ selectorName: "", selectorOptionsAsCSV: "" });
  const [selectorErrors, setSelectorErrors] = useState([]);
  const [newSelectorErrors, setNewSelectorErrors] = useState({});

  const {
    onUpdateProduct,
    product
  } = useProduct();

  const submitNewSelectorForm = async () => {
    const errors = await selectorValidator(selectorSchema.clean(newSelector));

    if (errors.length) {
      const errorObj = {};

      errors.forEach(({ name, message }) => {
        errorObj[name] = message;
      });

      setNewSelectorErrors(errorObj);

      return;
    }

    setSelectorErrors({});

    setSelectors((prevState) => [
      ...prevState,
      newSelector
    ]);

    setNewSelector({ selectorName: "", selectorOptionsAsCSV: "" });
  };

  const removeSelector = async (itemIndexToRemove) => {
    setSelectors((prevState) => [
      ...prevState.filter((item, index) => index !== itemIndexToRemove)
    ]);
  };

  const submitForm = async () => {
    setIsSubmitting(true);

    const fieldErrors = [];
    let hasErrors = false;

    // Get all errors for fields
    for (const selector of selectors) {
      // eslint-disable-next-line no-await-in-loop
      const groupErrors = await selectorValidator(selectorSchema.clean(selector));
      const errorObj = {};

      if (groupErrors.length) {
        hasErrors = true;
      }

      for (const { name, message } of groupErrors) {
        errorObj[name] = message;
      }

      fieldErrors.push(errorObj);
    }

    if (hasErrors) {
      setSelectorErrors(fieldErrors);
      return;
    }

    // Cleanup input, and remove any extra fields that may linger from GQL
    const cleanedInput = formSchema.clean({
      selectors
    });

    await onUpdateProduct({
      product: cleanedInput
    });

    setSelectorErrors([]);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (product) {
      setSelectors(clone(product.selectors) || []);
    }
  }, [
    product
  ]);

  useEffect(() => {
    setDirty((product && !equal(product.selectors, selectors)));
  }, [
    product,
    selectors
  ]);

  if (!product) {
    return null;
  }

  return (
    <Card>
      <CardHeader title="selectors" />
      <CardContent>
        <Grid
          className={classes.grid}
          container
          spacing={2}
        >
          {Array.isArray(selectors) && selectors.map((selector, index) => (
            <Fragment key={`selector-${index}`}>
              <Grid
                item
                sm={3}
              >
                <TextField
                  error={selectorErrors[index] && selectorErrors[index].selectorName}
                  fullWidth
                  helperText={selectorErrors[index] && selectorErrors[index].selectorName}
                  placeholder="selector name"
                  onChange={(event) => {
                    setSelectors((prevState) => {
                      const nextState = [...prevState];
                      nextState[index].selectorName = event.currentTarget.value;
                      return nextState;
                    });
                  }}
                  value={selector.selectorName}
                />
              </Grid>

              <Grid
                item
                sm={8}
              >
                <TextField
                  error={selectorErrors[index] && selectorErrors[index].selectorOptionsAsCSV}
                  fullWidth
                  helperText={selectorErrors[index] && selectorErrors[index].selectorOptionsAsCSV}
                  onChange={(event) => {
                    setSelectors((prevState) => {
                      const nextState = [...prevState];
                      nextState[index].selectorOptionsAsCSV = event.currentTarget.value;
                      return nextState;
                    });
                  }}
                  placeholder="selector options as CSV"
                  value={selector.selectorOptionsAsCSV}
                />
              </Grid>

              <Grid
                item
                sm={1}
              >
                <IconButton onClick={() => removeSelector(index)}>
                  <CloseIcon />
                </IconButton>
              </Grid>
            </Fragment>
          ))}

          <Grid item sm={3}>
            <TextField
              error={newSelectorErrors.selectorName}
              fullWidth
              helperText={newSelectorErrors.selectorName}
              placeholder="selector name"
              onChange={(event) => {
                setNewSelector((prevState) => {
                  const nextState = { ...prevState };
                  nextState.selectorName = event.currentTarget.value;
                  return nextState;
                });
              }}
              value={newSelector.selectorName}
            />
          </Grid>

          <Grid item sm={8}>
            <TextField
              error={newSelectorErrors.selectorOptionsAsCSV}
              fullWidth
              helperText={newSelectorErrors.selectorOptionsAsCSV}
              onChange={(event) => {
                setNewSelector((prevState) => {
                  const nextState = { ...prevState };
                  nextState.selectorOptionsAsCSV = event.currentTarget.value;
                  return nextState;
                });
              }}
              placeholder="selector options as CSV"
              value={newSelector.selectorOptionsAsCSV}
            />
          </Grid>
          <Grid item sm={1}>
            <IconButton onClick={() => submitNewSelectorForm()}>
              <PlusIcon />
            </IconButton>
          </Grid>
        </Grid>
        <Box textAlign="right">
          <Button
            color="primary"
            disabled={!isDirty || isSubmitting}
            variant="contained"
            onClick={() => submitForm()}
            type="submit"
          >
            {i18next.t("app.saveChanges")}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

ProductSelectorForm.propTypes = {
  newSelector: PropTypes.object,
  onProductFieldChange: PropTypes.func,
  onProductSelectorChange: PropTypes.func,
  onProductSelectorRemove: PropTypes.func,
  onProductSelectorSave: PropTypes.func,
  onProductSelectChange: PropTypes.func,
  onSitemapCheckboxChange: PropTypes.func,
  product: PropTypes.object
};

export default ProductSelectorForm;
